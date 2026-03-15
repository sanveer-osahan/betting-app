import { prisma } from "./prisma";
import schedules from "./ipl-2026-schedule.json";

export async function seedSchedules() {
  await prisma.schedule.deleteMany({ where: { isSystemGenerated: true } });

  for (const entry of schedules) {
    const team1 = await prisma.team.findUnique({
      where: { fullName: entry.team1 },
    });
    const team2 = await prisma.team.findUnique({
      where: { fullName: entry.team2 },
    });

    if (!team1 || !team2) {
      console.warn(
        `Skipping match ${entry.match}: team not found (${entry.team1} vs ${entry.team2})`
      );
      continue;
    }

    const startsAt = new Date(entry.startsAt);

    await prisma.schedule.upsert({
      where: {
        team1Id_team2Id_startsAt: {
          team1Id: team1.id,
          team2Id: team2.id,
          startsAt,
        },
      },
      update: {
        isSystemGenerated: true,
      },
      create: {
        team1Id: team1.id,
        team2Id: team2.id,
        startsAt,
        isSystemGenerated: true,
      },
    });
  }
}
