import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const players = await prisma.player.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(players);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await prisma.player.findUnique({ where: { name: name.trim() } });
  if (existing) {
    return NextResponse.json({ error: "Player with this name already exists" }, { status: 400 });
  }

  const player = await prisma.player.create({ data: { name: name.trim() } });
  return NextResponse.json(player, { status: 201 });
}
