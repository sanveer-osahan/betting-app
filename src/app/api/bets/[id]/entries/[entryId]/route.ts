import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, entryId } = await params;
  const { team, amount } = await req.json();

  if (team && team !== "team1" && team !== "team2") {
    return NextResponse.json({ error: "team must be 'team1' or 'team2'" }, { status: 400 });
  }

  if (amount != null && (typeof amount !== "number" || amount < 100 || amount % 50 !== 0)) {
    return NextResponse.json(
      { error: "Amount must be at least 100 and divisible by 50" },
      { status: 400 }
    );
  }

  const entry = await prisma.betEntry.findUnique({
    where: { id: entryId },
    include: { bet: true },
  });

  if (!entry || entry.betId !== id) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
  if (entry.bet.status !== "open") {
    return NextResponse.json({ error: "Bet is not open" }, { status: 400 });
  }

  const updated = await prisma.betEntry.update({
    where: { id: entryId },
    data: {
      ...(team && { team }),
      ...(amount != null && { amount }),
    },
    include: { player: { select: { id: true, name: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, entryId } = await params;

  const entry = await prisma.betEntry.findUnique({
    where: { id: entryId },
    include: { bet: true },
  });

  if (!entry || entry.betId !== id) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
  if (entry.bet.status !== "open") {
    return NextResponse.json({ error: "Bet is not open" }, { status: 400 });
  }

  await prisma.betEntry.delete({ where: { id: entryId } });
  return NextResponse.json({ success: true });
}
