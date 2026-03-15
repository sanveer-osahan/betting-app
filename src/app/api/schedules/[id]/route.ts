import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const schedule = await prisma.schedule.findUnique({ where: { id } });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    if (schedule.isSystemGenerated) {
      return NextResponse.json(
        { error: "System-generated schedules cannot be deleted" },
        { status: 403 }
      );
    }

    await prisma.schedule.delete({ where: { id } });
    return NextResponse.json({ message: "Schedule deleted" });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
