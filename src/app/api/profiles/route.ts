import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json(profiles);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await request.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Profile name is required" }, { status: 400 });
  }

  const profile = await prisma.profile.create({
    data: { name: name.trim() },
  });

  return NextResponse.json(profile, { status: 201 });
}
