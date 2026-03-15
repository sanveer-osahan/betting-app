import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const teams = await prisma.team.findMany({
    select: {
      id: true,
      fullName: true,
      shortName: true,
      teamColor: true,
      isSystemGenerated: true,
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json(teams);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { fullName, shortName, teamColor } = await request.json();

    if (!fullName || !shortName || !teamColor) {
      return NextResponse.json(
        { error: "Full name, short name, and team color are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.team.findFirst({
      where: {
        OR: [{ fullName }, { shortName }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A team with that name or short name already exists" },
        { status: 409 }
      );
    }

    const team = await prisma.team.create({
      data: {
        fullName,
        shortName,
        teamColor,
        isSystemGenerated: false,
      },
      select: {
        id: true,
        fullName: true,
        shortName: true,
        teamColor: true,
        isSystemGenerated: true,
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
