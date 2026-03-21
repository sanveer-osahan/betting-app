# Betting App

## Structure
- **Players** — Named entities that participate in bets. Managed via the Players tab.
- **Bets** — A match between two free-text team names with a match date. Can be "open" or "complete".
- **BetEntries** — A player's wager on a specific bet, picking a team and amount.
- **Leaderboard** — Aggregates profit/loss across all completed bets per player.
- All authenticated users have equal access. No admin roles.

## UI Rules
- Never display created/updated timestamps for entities in the UI.
- Mobile-optimized (16:9 portrait). Dark theme (bg-gray-950 main, bg-gray-900 cards).

## Timezone
- All timestamps everywhere — in the database, APIs, JSON files, and UI — must be in IST (Indian Standard Time, UTC+5:30).
- Use the `+05:30` offset in ISO 8601 format (e.g., `2026-03-28T15:30:00+05:30`), never UTC/Z.

## Tech Stack
- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 4
- PostgreSQL + Prisma ORM
- bcryptjs for password hashing
- Dev server runs on port 3003
