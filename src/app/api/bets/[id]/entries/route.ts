import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentProfileId } = session;
  if (!currentProfileId) return NextResponse.json({ error: "No profile selected" }, { status: 403 });

  const { id } = await params;

  const entries = await prisma.betEntry.findMany({
    where: { betId: id, bet: { profileId: currentProfileId } },
    include: { player: { select: { id: true, name: true } } },
  });
  return NextResponse.json(entries);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentProfileId } = session;
  if (!currentProfileId) return NextResponse.json({ error: "No profile selected" }, { status: 403 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Read-only access" }, { status: 403 });

  const { id } = await params;
  const { playerId, team, amount } = await req.json();

  if (!playerId || !team || amount == null) {
    return NextResponse.json(
      { error: "playerId, team, and amount are required" },
      { status: 400 }
    );
  }

  if (team !== "team1" && team !== "team2") {
    return NextResponse.json({ error: "team must be 'team1' or 'team2'" }, { status: 400 });
  }

  if (typeof amount !== "number" || amount < 100 || amount % 50 !== 0) {
    return NextResponse.json(
      { error: "Amount must be at least 100 and divisible by 50" },
      { status: 400 }
    );
  }

  const bet = await prisma.bet.findUnique({ where: { id, profileId: currentProfileId } });
  if (!bet) {
    return NextResponse.json({ error: "Bet not found" }, { status: 404 });
  }
  if (bet.status !== "open") {
    return NextResponse.json({ error: "Bet is not open" }, { status: 400 });
  }

  const existing = await prisma.betEntry.findUnique({
    where: { betId_playerId: { betId: id, playerId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Player already has an entry in this bet" },
      { status: 400 }
    );
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId, profileId: currentProfileId },
  });
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const entry = await prisma.betEntry.create({
    data: { betId: id, playerId, team, amount },
    include: { player: { select: { id: true, name: true } } },
  });
  return NextResponse.json(entry, { status: 201 });
}
