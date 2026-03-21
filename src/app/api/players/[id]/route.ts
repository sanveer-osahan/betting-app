import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const player = await prisma.player.findUnique({
    where: { id },
    include: { betEntries: { select: { id: true }, take: 1 } },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  if (player.betEntries.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete player with existing bet entries" },
      { status: 400 }
    );
  }

  await prisma.player.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
