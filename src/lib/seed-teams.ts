import { prisma } from "./prisma";
import { IPL_TEAMS } from "./teams-seed";

export async function seedTeams() {
  for (const team of IPL_TEAMS) {
    await prisma.team.upsert({
      where: { shortName: team.shortName },
      update: {},
      create: {
        fullName: team.fullName,
        shortName: team.shortName,
        teamColor: team.teamColor,
        isSystemGenerated: true,
      },
    });
  }
}
