import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeValidation, computePayouts } from "@/lib/betting";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { winningTeam } = await req.json();

  if (winningTeam !== "team1" && winningTeam !== "team2") {
    return NextResponse.json(
      { error: "winningTeam must be 'team1' or 'team2'" },
      { status: 400 }
    );
  }

  const bet = await prisma.bet.findUnique({
    where: { id },
    include: { entries: true },
  });

  if (!bet) {
    return NextResponse.json({ error: "Bet not found" }, { status: 404 });
  }
  if (bet.status === "complete") {
    return NextResponse.json({ error: "Bet is already complete" }, { status: 400 });
  }

  const entriesInput = bet.entries.map((e) => ({ team: e.team, amount: e.amount }));
  const validation = computeValidation(entriesInput);

  if (!validation.valid) {
    const deficitTeamName =
      validation.deficitTeam === "team1"
        ? bet.team1Name
        : validation.deficitTeam === "team2"
          ? bet.team2Name
          : null;
    return NextResponse.json(
      {
        error: "Bet is not valid",
        deficit: validation.deficit,
        deficitTeam: validation.deficitTeam,
        deficitTeamName,
      },
      { status: 400 }
    );
  }

  const payouts = computePayouts(entriesInput, winningTeam);

  await prisma.$transaction([
    prisma.bet.update({
      where: { id },
      data: { status: "complete", winningTeam },
    }),
    ...bet.entries.map((entry, i) =>
      prisma.betEntry.update({
        where: { id: entry.id },
        data: { result: payouts[i].result },
      })
    ),
  ]);

  const updated = await prisma.bet.findUnique({
    where: { id },
    include: {
      entries: {
        include: { player: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(updated);
}
