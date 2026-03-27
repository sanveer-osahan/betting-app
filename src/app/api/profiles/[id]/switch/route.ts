import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/auth";
import { cookies } from "next/headers";
import { COOKIE_OPTIONS } from "@/lib/cookies";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const profile = await prisma.profile.findUnique({ where: { id } });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const updatedSession = {
    ...session,
    currentProfileId: profile.id,
    currentProfileName: profile.name,
  };

  const cookieStore = await cookies();
  cookieStore.set("session", JSON.stringify(updatedSession), COOKIE_OPTIONS);

  return NextResponse.json({ ok: true });
}
