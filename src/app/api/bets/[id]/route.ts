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

  const bet = await prisma.bet.findUnique({
    where: { id, profileId: currentProfileId },
    include: {
      entries: {
        include: { player: { select: { id: true, name: true } } },
      },
    },
  });

  if (!bet) {
    return NextResponse.json({ error: "Bet not found" }, { status: 404 });
  }

  return NextResponse.json(bet);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentProfileId } = session;
  if (!currentProfileId) return NextResponse.json({ error: "No profile selected" }, { status: 403 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Read-only access" }, { status: 403 });

  const { id } = await params;

  const bet = await prisma.bet.findUnique({ where: { id, profileId: currentProfileId } });
  if (!bet) {
    return NextResponse.json({ error: "Bet not found" }, { status: 404 });
  }
  if (bet.status === "complete") {
    return NextResponse.json({ error: "Cannot delete a completed bet" }, { status: 400 });
  }

  await prisma.bet.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
