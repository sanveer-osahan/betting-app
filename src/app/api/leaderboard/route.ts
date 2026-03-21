import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const players = await prisma.player.findMany({
    include: {
      betEntries: {
        where: { bet: { status: "complete" } },
        select: { result: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const leaderboard = players
    .map((player) => ({
      playerId: player.id,
      playerName: player.name,
      totalAmount: player.betEntries.reduce((sum, e) => sum + (e.result ?? 0), 0),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return NextResponse.json(leaderboard);
}
