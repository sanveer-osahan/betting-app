## Enhanced Implementation Prompt

### Objective
Sort open bets by match date ascending (soonest first) and closed/completed bets by match date descending (most recent first) on the bets listing page.

### Context
- **Tech stack**: Next.js 15 (App Router), React 19, TypeScript, Prisma + PostgreSQL
- **Key files**:
  - `src/app/(app)/bets/BetsClient.tsx` — UI component where bets are filtered into open/complete lists (lines 65-66)
  - `src/app/api/bets/route.ts` — API route that fetches all bets, currently ordered by `matchDate: "desc"` (line 14)
- **Related patterns**: Filtering is done client-side in `BetsClient.tsx` after a single fetch of all bets.

### Requirements
1. Open bets must be displayed sorted by `matchDate` ascending (soonest upcoming match first).
2. Completed bets must be displayed sorted by `matchDate` descending (most recently played match first).

### Implementation Details
Sort client-side in `BetsClient.tsx` after filtering, rather than changing the API. This avoids needing two separate API calls or query params.

In `BetsClient.tsx`, update the filter lines (currently lines 65-66):

```typescript
// Current
const openBets = bets.filter((b) => b.status === "open");
const completeBets = bets.filter((b) => b.status === "complete");

// Replace with
const openBets = bets
  .filter((b) => b.status === "open")
  .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

const completeBets = bets
  .filter((b) => b.status === "complete")
  .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());
```

The `matchDate` field is an ISO 8601 string (stored in IST, `+05:30` offset). `new Date(isoString).getTime()` correctly parses offset-aware strings in all modern JS runtimes — no additional parsing library needed.

The API-level `orderBy: { matchDate: "desc" }` in `src/app/api/bets/route.ts` can be left unchanged, as the client-side sort will override it.

### Edge Cases & Constraints
- If two bets share the same `matchDate`, their relative order is undefined — this is acceptable.
- `matchDate` is always present (non-nullable in the schema), so no null-check is needed.

### Testing
Manually verify in the UI:
- Open bets section: bet with the earliest upcoming `matchDate` appears first.
- Completed bets section: bet with the most recent `matchDate` appears first.

No unit tests needed for this change — it is a trivial sort on a filtered array.

### Out of Scope
- Changing the API query ordering.
- Adding sort controls or user-configurable sorting.
- Sorting on any field other than `matchDate`.
- Changes to the bet detail page or any other page.
