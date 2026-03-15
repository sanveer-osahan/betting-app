export async function onRequestError() {
  // Required export for instrumentation
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { seedTeams } = await import("./lib/seed-teams");
    try {
      await seedTeams();
      console.log("IPL teams seeded successfully");
    } catch (error) {
      console.error("Failed to seed teams:", error);
    }
  }
}
