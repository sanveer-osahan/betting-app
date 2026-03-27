import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/auth";
import { cookies } from "next/headers";
import { COOKIE_OPTIONS } from "@/lib/cookies";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name } = await request.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Profile name is required" }, { status: 400 });
  }

  const profile = await prisma.profile.update({
    where: { id },
    data: { name: name.trim() },
  });

  // If this is the currently active profile, update session with new name
  if (session.currentProfileId === id) {
    const updatedSession = { ...session, currentProfileName: profile.name };
    const cookieStore = await cookies();
    cookieStore.set("session", JSON.stringify(updatedSession), COOKIE_OPTIONS);
  }

  return NextResponse.json(profile);
}
