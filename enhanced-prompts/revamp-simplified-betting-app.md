# Enhanced Implementation Prompt

## Objective

Revamp the betting app by removing admin/non-admin roles, schedules, and teams. Replace with a simplified 3-tab dashboard (Leaderboard, Bets, Players) where any user can create bets between two teams (free-text names), assign players with team picks and amounts, and complete bets by selecting a winner — with a leaderboard aggregating player wins/losses.

## Context

- **Tech stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, PostgreSQL + Prisma ORM, bcryptjs
- **Dev server**: Port 3003
- **Timezone**: All timestamps in IST (`+05:30`), never UTC
- **UI rules**: No created/updated timestamps displayed. Mobile-optimized (16:9 portrait). Dark theme (bg-gray-950 main, bg-gray-900 cards).
- **Landing page**: Keep `/src/app/page.tsx` as-is (the betting simulator demo). Do not modify it.

### Key files to modify/remove

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Rewrite models (drop Team, Schedule; add Player; redesign Bet) |
| `src/lib/auth.ts` | Remove `isAdmin()` function entirely |
| `src/app/dashboard/layout.tsx` | Replace tabs: Leaderboard, Bets, Players (no admin check) |
| `src/app/dashboard/page.tsx` | Rewrite — default tab landing |
| `src/app/dashboard/bets/page.tsx` | Rewrite — new bet creation + open/complete collapsible lists |
| `src/app/dashboard/bets/[scheduleId]/page.tsx` | Remove (replace with `[betId]/page.tsx`) |
| `src/app/dashboard/users/page.tsx` | Delete |
| `src/app/dashboard/teams/page.tsx` | Delete (replaced by Players tab) |
| `src/app/dashboard/schedules/page.tsx` | Delete |
| `src/app/dashboard/my-teams/page.tsx` | Delete |
| `src/app/api/users/` | Delete (all user CRUD routes) |
| `src/app/api/teams/` | Delete |
| `src/app/api/schedules/` | Delete |
| `src/app/api/bets/` | Rewrite for new schema |
| `src/lib/teams-seed.ts` | Delete |
| `src/lib/seed-teams.ts` | Delete |
| `src/lib/seed-schedules.ts` | Delete |
| `src/lib/ipl-2026-schedule.json` | Delete |

### Existing patterns to follow

- Client components with `"use client"` for interactive pages
- `useState`, `useCallback` for state management
- `fetch()` to internal API routes for all data operations
- Collapsible sections pattern already exists in `bets/page.tsx` (reuse the expand/collapse UI pattern)
- Modal confirmation for destructive actions (delete)
- Loading/disabled states on buttons during async ops
- Error display in red text divs
- API responses: 200/201 success, 400 validation, 401 unauth, 404 not found

## Requirements

### Database Schema Changes

1. **Remove** the `Team`, `Schedule` models entirely.
2. **Remove** the existing `Bet` model.
3. **Create `Player` model**:
   - `id` (String, CUID, primary key)
   - `name` (String, unique)
   - `createdAt`, `updatedAt` (DateTime)
   - Relation: `betEntries BetEntry[]`

4. **Create `Bet` model** (a match/event):
   - `id` (String, CUID, primary key)
   - `team1Name` (String, required)
   - `team2Name` (String, required)
   - `matchDate` (DateTime, required, stored in IST)
   - `status` (String: `"open"` or `"complete"`, default `"open"`)
   - `winningTeam` (String, nullable — set to `"team1"` or `"team2"` when completed)
   - `createdAt`, `updatedAt` (DateTime)
   - Relation: `entries BetEntry[]`

5. **Create `BetEntry` model** (a player's bet on a specific match):
   - `id` (String, CUID, primary key)
   - `betId` (String, foreign key to Bet)
   - `playerId` (String, foreign key to Player)
   - `team` (String: `"team1"` or `"team2"` — which team the player is backing)
   - `amount` (Int, in rupees)
   - `result` (Int, nullable — calculated profit/loss when bet completes, positive = win, negative = loss)
   - `createdAt`, `updatedAt` (DateTime)
   - Unique constraint: `(betId, playerId)` — one entry per player per bet
   - Relations: `bet Bet`, `player Player`

6. **Keep `User` model** unchanged (login/auth only).

7. **Create a Prisma migration** and drop all existing data (fresh start, no seed data).

### API Routes

8. **Player APIs** — Create new directory `src/app/api/players/`:
   - `GET /api/players` — List all players sorted by name
   - `POST /api/players` — Create player (body: `{ name }`). Validate name is non-empty and unique.
   - `DELETE /api/players/[id]` — Delete player. Fail with 400 if player has any BetEntries (on open OR complete bets).

9. **Bet APIs** — Rewrite `src/app/api/bets/`:
   - `GET /api/bets` — List all bets with their entries (include player names). Return them all; the frontend will split by status.
   - `POST /api/bets` — Create a new bet (body: `{ team1Name, team2Name, matchDate }`). All fields required. Status defaults to `"open"`.
   - `DELETE /api/bets/[id]` — Delete an open bet and all its entries. Fail if bet is complete.
   - `PUT /api/bets/[id]/complete` — Complete a bet:
     - Body: `{ winningTeam: "team1" | "team2" }`
     - Run the validation algorithm (same as landing page demo) to check the bet is valid
     - If invalid, return 400 with the deficit details
     - If valid, calculate each entry's `result` using the payout algorithm and update all entries
     - Set bet `status = "complete"` and `winningTeam`
     - Completion is permanent — no undo

10. **BetEntry APIs** — Create `src/app/api/bets/[id]/entries/`:
    - `GET /api/bets/[id]/entries` — List entries for a bet with player names
    - `POST /api/bets/[id]/entries` — Add a player entry (body: `{ playerId, team, amount }`). Validate: bet is open, amount >= 100 and divisible by 50, player not already in this bet.
    - `PUT /api/bets/[id]/entries/[entryId]` — Update entry (body: `{ team, amount }`). Validate: bet is open, same amount rules.
    - `DELETE /api/bets/[id]/entries/[entryId]` — Remove entry. Validate: bet is open.

11. **Leaderboard API** — `GET /api/leaderboard`:
    - Aggregate `result` field from `BetEntry` for all completed bets, grouped by player
    - Return `[{ playerId, playerName, totalAmount }]` sorted by `totalAmount` descending
    - Include players with zero results (they appear at the bottom with ₹0)

12. **Remove** all existing API routes for: `/api/users`, `/api/teams`, `/api/schedules`. Keep `/api/login`, `/api/logout`, `/api/signup` unchanged.

13. **Remove `isAdmin()`** from `src/lib/auth.ts`. Remove all admin checks from API routes and pages. All authenticated users have equal access.

### Frontend Pages

14. **Dashboard layout** (`src/app/dashboard/layout.tsx`):
    - 3 tabs: **Leaderboard**, **Bets**, **Players**
    - No admin/non-admin logic. All users see the same tabs.
    - Keep existing logout button and session display.
    - Default route `/dashboard` should show the Leaderboard tab content.

15. **Players tab** (`src/app/dashboard/players/page.tsx` — new):
    - List all players with a simple "Add Player" form (just a name input + button)
    - Each player row has a delete button
    - Delete shows a confirmation modal
    - Delete fails with an error message if the player has any bet entries
    - Mobile-optimized layout

16. **Bets tab** (`src/app/dashboard/bets/page.tsx` — rewrite):
    - **Create Bet** section at top: form with team1 name, team2 name, match date (datetime-local input). Submit creates an open bet.
    - **Two collapsible sections** (both expanded by default):
      - **Open Bets** — sorted by matchDate descending. Each tile shows team1 vs team2 and match date. Clicking a tile navigates to the bet detail page. Each tile has a delete icon/button (with confirmation).
      - **Completed Bets** — sorted by matchDate descending. Each tile shows team1 vs team2, match date, and the winning team highlighted. Clicking navigates to the bet detail page (read-only view showing results).

17. **Bet detail page** (`src/app/dashboard/bets/[betId]/page.tsx` — new):
    - **Header**: Team1 Name vs Team2 Name, match date
    - **If bet is open**:
      - Show list of current entries (player name, team picked, amount) with edit/delete buttons per entry
      - "Add Player" section: dropdown of available players (those not already in this bet), team selector (team1/team2), amount input. Submit adds entry.
      - Edit inline or via modal: change team pick and/or amount
      - **"Complete Bet" button**: prompts user to select winning team. Calls the complete API. If invalid, show the error (deficit info). If valid, page refreshes to show completed state.
      - Show the validity status in real-time: run the validation algorithm client-side and display whether the bet is currently valid or invalid (and why), same as the landing page demo does.
    - **If bet is complete** (read-only):
      - Show winning team highlighted
      - Show all entries with their results: player name, team picked, amount bet, result (profit in green with +, loss in red with -)
      - No edit/delete/add controls

18. **Leaderboard tab** (`src/app/dashboard/page.tsx` or `src/app/dashboard/leaderboard/page.tsx`):
    - Table/list of players sorted by aggregate result descending
    - Columns: Rank, Player Name, Total Amount
    - Positive amounts: green text, prefixed with `+` (e.g., `+₹500`)
    - Negative amounts: red text, prefixed with `-` (e.g., `-₹300`)
    - Zero amounts: neutral/white text, `₹0`

19. **Delete** these pages entirely:
    - `src/app/dashboard/users/page.tsx`
    - `src/app/dashboard/teams/page.tsx`
    - `src/app/dashboard/schedules/page.tsx`
    - `src/app/dashboard/my-teams/page.tsx`
    - `src/app/dashboard/bets/[scheduleId]/page.tsx`

### Betting Algorithm (reuse from landing page)

20. **Validation algorithm** (extract into a shared utility at `src/lib/betting.ts`):
    - Group entries by team
    - If no entries on either team: invalid
    - If both teams have entries:
      - If total amounts are equal: valid
      - If amounts differ: determine higher/lower team. If higher team has more players, `requiredAmount = (higherAmount / higherCount) * lowerCount`. Otherwise `requiredAmount = higherAmount`. Valid if `lowerAmount >= requiredAmount`. Invalid with deficit = `requiredAmount - lowerAmount`.

21. **Payout algorithm** (same utility):
    - `totalPool = sum of all entry amounts`
    - For each winning entry: `payout = (entryAmount / totalWinningAmount) * totalPool`, `result = payout - entryAmount` (positive profit)
    - For each losing entry: `result = -entryAmount` (negative, full loss)
    - Results should be rounded to nearest integer

### Cleanup

22. **Remove seed files**: Delete `src/lib/teams-seed.ts`, `src/lib/seed-teams.ts`, `src/lib/seed-schedules.ts`, `src/lib/ipl-2026-schedule.json`.

23. **Update `CLAUDE.md`**: Remove references to admin role, admin-only features, and schedules. Update to reflect new simplified structure.

## Edge Cases & Constraints

- A player cannot be deleted if they have any BetEntries (open or complete). Show a clear error.
- A bet cannot be deleted if it's complete.
- A bet cannot be completed if it's invalid per the validation algorithm.
- Completion is permanent — no reopening.
- BetEntry amount must be >= 100 and divisible by 50.
- One entry per player per bet (enforced by unique constraint and API validation).
- Match date must be stored and displayed in IST (+05:30).
- The `datetime-local` input for match date should append `+05:30` offset when saving (follow existing pattern from schedules page).
- All API routes require authentication (check session). Return 401 if not authenticated.
- No timestamps displayed in the UI (per CLAUDE.md rule).

## Testing

- No automated tests exist in the codebase currently. No new tests are required.
- Manual testing: verify login, create players, create bets, add entries, validate algorithm, complete bets, check leaderboard aggregation.

## Out of Scope

- Do NOT modify the landing page (`src/app/page.tsx`) — keep the simulator demo as-is.
- Do NOT modify the login page (`src/app/login/page.tsx`) or auth APIs (`/api/login`, `/api/logout`, `/api/signup`).
- Do NOT add role-based access control — all authenticated users are equal.
- Do NOT add user management UI — signup is the only way to create users.
- Do NOT add team management — team names are free-text on each bet.
- Do NOT add any test files.
- Do NOT add any documentation files.
