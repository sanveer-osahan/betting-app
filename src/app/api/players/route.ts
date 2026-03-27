import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentProfileId } = session;
  if (!currentProfileId) return NextResponse.json({ error: "No profile selected" }, { status: 403 });

  const players = await prisma.player.findMany({
    where: { profileId: currentProfileId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(players);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentProfileId } = session;
  if (!currentProfileId) return NextResponse.json({ error: "No profile selected" }, { status: 403 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Read-only access" }, { status: 403 });

  const { name } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await prisma.player.findUnique({
    where: { name_profileId: { name: name.trim(), profileId: currentProfileId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A player with this name already exists in this profile" },
      { status: 400 }
    );
  }

  const player = await prisma.player.create({
    data: { name: name.trim(), profileId: currentProfileId },
  });
  return NextResponse.json(player, { status: 201 });
}
