import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function isBettingOpen(startsAt: Date): boolean {
  const now = new Date();
  const startsAtTime = new Date(startsAt).getTime();
  const nowTime = now.getTime();
  const diffMs = startsAtTime - nowTime;

  if (diffMs > 0) {
    return true;
  } else {
    return Math.abs(diffMs) < 4 * 60 * 60 * 1000;
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { teamId, amount } = await request.json();

    if (!teamId || !amount) {
      return NextResponse.json(
        { error: "teamId and amount are required" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount < 100 || amount % 50 !== 0) {
      return NextResponse.json(
        { error: "Amount must be at least 100 and in increments of 50" },
        { status: 400 }
      );
    }

    const bet = await prisma.bet.findUnique({
      where: { id },
      include: { schedule: true },
    });

    if (!bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }

    if (bet.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isBettingOpen(bet.schedule.startsAt)) {
      return NextResponse.json(
        { error: "Betting is closed for this match" },
        { status: 400 }
      );
    }

    if (teamId !== bet.schedule.team1Id && teamId !== bet.schedule.team2Id) {
      return NextResponse.json(
        { error: "teamId must be one of the teams in this schedule" },
        { status: 400 }
      );
    }

    const updated = await prisma.bet.update({
      where: { id },
      data: { teamId, amount },
      include: {
        team: { select: { id: true, fullName: true, shortName: true, teamColor: true } },
        user: { select: { id: true, name: true, username: true } },
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const bet = await prisma.bet.findUnique({
      where: { id },
      include: { schedule: true },
    });

    if (!bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }

    if (bet.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isBettingOpen(bet.schedule.startsAt)) {
      return NextResponse.json(
        { error: "Betting is closed for this match" },
        { status: 400 }
      );
    }

    await prisma.bet.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
