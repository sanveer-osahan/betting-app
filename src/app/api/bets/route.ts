import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function getISTNow(): Date {
  return new Date();
}

function isBettingOpen(startsAt: Date): boolean {
  const now = getISTNow();
  const startsAtTime = new Date(startsAt).getTime();
  const nowTime = now.getTime();
  const diffMs = startsAtTime - nowTime;

  if (diffMs > 0) {
    // Before match: open if less than 24 hours before
    return true;
  } else {
    // After match start: open if less than 4 hours after
    return Math.abs(diffMs) < 4 * 60 * 60 * 1000;
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { scheduleId, teamId, amount } = await request.json();

    if (!scheduleId || !teamId || !amount) {
      return NextResponse.json(
        { error: "scheduleId, teamId, and amount are required" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount < 100 || amount % 50 !== 0) {
      return NextResponse.json(
        { error: "Amount must be at least 100 and in increments of 50" },
        { status: 400 }
      );
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        bets: {
          select: { id: true, teamId: true, amount: true, userId: true },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    if (!isBettingOpen(schedule.startsAt)) {
      return NextResponse.json(
        { error: "Betting is closed for this match" },
        { status: 400 }
      );
    }

    if (teamId !== schedule.team1Id && teamId !== schedule.team2Id) {
      return NextResponse.json(
        { error: "teamId must be one of the teams in this schedule" },
        { status: 400 }
      );
    }

    // Check if user already has a bet on this schedule
    const existingBet = await prisma.bet.findUnique({
      where: { scheduleId_userId: { scheduleId, userId: session.id } },
    });

    if (existingBet) {
      return NextResponse.json(
        { error: "You already have a bet on this match. Use edit instead." },
        { status: 409 }
      );
    }

    const bet = await prisma.bet.create({
      data: {
        scheduleId,
        teamId,
        amount,
        userId: session.id,
      },
      include: {
        team: { select: { id: true, fullName: true, shortName: true, teamColor: true } },
        user: { select: { id: true, name: true, username: true } },
      },
    });

    return NextResponse.json(bet, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
