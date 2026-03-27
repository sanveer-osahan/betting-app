import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentProfileId } = session;
  if (!currentProfileId) return NextResponse.json({ error: "No profile selected" }, { status: 403 });

  const bets = await prisma.bet.findMany({
    where: { profileId: currentProfileId },
    orderBy: { matchDate: "desc" },
    include: {
      entries: {
        include: { player: { select: { id: true, name: true } } },
      },
    },
  });
  return NextResponse.json(bets);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentProfileId } = session;
  if (!currentProfileId) return NextResponse.json({ error: "No profile selected" }, { status: 403 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Read-only access" }, { status: 403 });

  const { team1Name, team2Name, matchDate } = await req.json();

  if (!team1Name?.trim() || !team2Name?.trim() || !matchDate) {
    return NextResponse.json(
      { error: "team1Name, team2Name, and matchDate are required" },
      { status: 400 }
    );
  }

  const bet = await prisma.bet.create({
    data: {
      team1Name: team1Name.trim(),
      team2Name: team2Name.trim(),
      matchDate: new Date(matchDate),
      profileId: currentProfileId,
    },
  });
  return NextResponse.json(bet, { status: 201 });
}
