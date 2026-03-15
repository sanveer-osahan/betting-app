import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const schedules = await prisma.schedule.findMany({
    include: {
      team1: {
        select: { id: true, fullName: true, shortName: true, teamColor: true },
      },
      team2: {
        select: { id: true, fullName: true, shortName: true, teamColor: true },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json(schedules);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { team1Id, team2Id, startsAt } = await request.json();

    if (!team1Id || !team2Id || !startsAt) {
      return NextResponse.json(
        { error: "Team 1, Team 2, and start time are required" },
        { status: 400 }
      );
    }

    if (team1Id === team2Id) {
      return NextResponse.json(
        { error: "Team 1 and Team 2 must be different" },
        { status: 400 }
      );
    }

    const [t1, t2] = await Promise.all([
      prisma.team.findUnique({ where: { id: team1Id } }),
      prisma.team.findUnique({ where: { id: team2Id } }),
    ]);

    if (!t1 || !t2) {
      return NextResponse.json(
        { error: "One or both teams not found" },
        { status: 404 }
      );
    }

    const schedule = await prisma.schedule.create({
      data: {
        team1Id,
        team2Id,
        startsAt: new Date(startsAt),
        isSystemGenerated: false,
      },
      include: {
        team1: {
          select: { id: true, fullName: true, shortName: true, teamColor: true },
        },
        team2: {
          select: { id: true, fullName: true, shortName: true, teamColor: true },
        },
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
