# Enhanced Prompt: Add Profile Management

## Objective

Introduce a multi-profile system where an admin user (hardcoded username `admin`) can create isolated profiles — each with its own players, bets, and leaderboard — and assign non-admin users as read-only viewers of a single profile.

---

## Context

- **Tech stack**: Next.js 15 (App Router), React 19, TypeScript, Prisma ORM, PostgreSQL, Tailwind CSS 4, bcryptjs, HTTP-only cookie sessions
- **Key files to read before implementing**:
  - `prisma/schema.prisma` — current schema (User, Player, Bet, BetEntry)
  - `src/lib/auth.ts` — session management (`getSession()`)
  - `src/app/api/login/route.ts` — login sets session cookie
  - `src/app/api/signup/route.ts` — user creation (to be restricted to admin)
  - `src/app/api/bets/route.ts` — example of current unscoped data access
  - `src/app/api/players/route.ts` — example of current unscoped data access
  - `src/app/dashboard/layout.tsx` — nav, auth guard, sub-nav
- **Related patterns**:
  - All API routes call `getSession()` and return 401 if null
  - Session is a JSON object stored in an httpOnly cookie named `session`
  - Admin is identified solely by `username === 'admin'` — no DB field needed
  - Dark theme: `bg-gray-950` main, `bg-gray-900` cards, `max-w-lg mx-auto` layout

---

## Requirements

### 1. Database Schema

Add a `Profile` model and attach it to existing models:

```prisma
model Profile {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  players   Player[]
  bets      Bet[]
  users     User[]
}

model User {
  // existing fields...
  profileId String?          // null for admin, required for non-admin
  profile   Profile? @relation(fields: [profileId], references: [id])
}

model Player {
  // existing fields...
  profileId String
  profile   Profile @relation(fields: [profileId], references: [id])
  // Remove @unique on name; replace with:
  @@unique([name, profileId])
}

model Bet {
  // existing fields...
  profileId String
  profile   Profile @relation(fields: [profileId], references: [id])
}
```

Write a Prisma migration that:
1. Creates the `Profile` table
2. Adds `profileId String?` (nullable) to `Player`, `Bet`, and `User`
3. Inserts a "Default" profile row via raw SQL in the migration
4. Updates all existing `Player` and `Bet` rows to point to the Default profile via raw SQL
5. Alters `Player.profileId` and `Bet.profileId` to `NOT NULL`
6. Drops the old `Player.name` unique index; adds `@@unique([name, profileId])`

Do **not** wipe `User` rows. `User.profileId` stays nullable (admin has no profile).

### 2. Session Type

Update `src/lib/auth.ts` — extend `Session` interface:

```typescript
export interface Session {
  id: string;
  username: string;
  name: string;
  isAdmin: boolean;
  currentProfileId: string | null; // admin: changes on switch; non-admin: their profile
}
```

Add a helper:
```typescript
export function isAdmin(session: Session): boolean {
  return session.username === 'admin';
}
```

### 3. Login Route (`src/app/api/login/route.ts`)

On successful login:
- If `username === 'admin'`: set `isAdmin: true`, `currentProfileId: null` in session
- If non-admin: look up `user.profileId` from DB, set `isAdmin: false`, `currentProfileId: user.profileId`
- Redirect hint in response: include `isAdmin` and `currentProfileId` so the client can redirect appropriately

### 4. New Profile API Routes

#### `GET /api/profiles` (admin only)
Returns all profiles ordered by `createdAt` asc. Include `users` count per profile.

#### `POST /api/profiles` (admin only)
Body: `{ name: string }`. Creates a new profile. Name is required and non-empty.

#### `PATCH /api/profiles/[id]` (admin only)
Body: `{ name: string }`. Renames a profile. No deletion endpoint.

#### `POST /api/profiles/[id]/switch` (admin only)
Updates the admin's session cookie: sets `currentProfileId` to the given profile id. Returns 200. This is how admin switches active profile.

#### `GET /api/profiles/[id]/users` (admin only)
Returns all non-admin users assigned to this profile.

#### `POST /api/profiles/[id]/users` (admin only)
Creates a new non-admin user assigned to this profile.
Body: `{ username: string, name: string, password: string }`.
- Validate: all fields required, password ≥ 6 chars, username unique
- Hash password with bcryptjs (salt 10)
- Creates `User` with `profileId` set to the given profile

### 5. Restrict Existing `/api/signup` Route

Change `POST /api/signup` to return `403 Forbidden` always (user creation is now admin-only via `/api/profiles/[id]/users`). Keep the route file but replace its body with a 403 response. The `/signup` UI page can be left as-is or removed — at minimum it should not be linked from anywhere.

### 6. Update All Existing Data API Routes

For every route in `src/app/api/bets/`, `src/app/api/players/`, `src/app/api/leaderboard/`:

- After `getSession()`, extract `session.currentProfileId`
- If `currentProfileId` is null (admin hasn't selected a profile), return `403` with `{ error: "No profile selected" }`
- Add `where: { profileId: currentProfileId }` to all Prisma queries
- On `POST` (create), include `profileId: currentProfileId` in the data
- For **non-admin users**: reject `POST`, `PUT`, `PATCH`, `DELETE` with `403 { error: "Read-only access" }`. Only `GET` is allowed.

### 7. Profiles Management Page (`/dashboard/profiles`)

New page at `src/app/dashboard/profiles/page.tsx`. **Admin only** — redirect non-admin to `/dashboard`.

Layout:
- Page title: "Profiles"
- "New Profile" button → inline form or modal: input for profile name → `POST /api/profiles`
- List of profiles, each card showing:
  - Profile name with inline edit (pencil icon → text input + save/cancel) → `PATCH /api/profiles/[id]`
  - "Switch to this profile" button → `POST /api/profiles/[id]/switch` → then navigate to `/dashboard`
  - Highlight the currently active profile (compare with `session.currentProfileId`)
  - Expandable "Users" section listing non-admin users in this profile
  - "Add User" form within the profile card: name, username, password fields → `POST /api/profiles/[id]/users`

### 8. Dashboard Layout (`src/app/dashboard/layout.tsx`)

**Admin guards:**
- If admin and `currentProfileId` is null → redirect to `/dashboard/profiles`
- Show current profile name in the nav bar (fetch from DB or include in session)
- Add "Profiles" link to the sub-nav (visible only for admin)
- Add a "Switch Profile" shortcut in nav (e.g., clicking the profile name goes to `/dashboard/profiles`)

**Non-admin:**
- No "Profiles" link in nav
- Sub-nav shows: Leaderboard | Bets | Players (same as now, but pages are read-only)
- Show a "View only" badge or indicator somewhere subtle in the nav

**Profile name in nav**: Fetch the current profile's name. Options: include `currentProfileName` in the session (update on switch), or fetch it server-side in the layout using `currentProfileId`. Prefer storing it in the session to avoid an extra DB call on every page load — update session on profile creation/rename/switch.

Update `Session` interface to also store `currentProfileName: string | null`.

### 9. Read-Only UI for Non-Admin

In the existing dashboard pages, hide all write controls when the user is non-admin. Pass `isAdmin` as a prop or read it from session server-side:

- `src/app/dashboard/bets/page.tsx`: Hide the "Create Bet" form, hide "Delete" buttons
- `src/app/dashboard/bets/[betId]/page.tsx`: Hide "Add Entry" form, hide edit/delete entry buttons, hide "Complete Bet" button
- `src/app/dashboard/players/page.tsx`: Hide "Add Player" form, hide "Delete" buttons

The pages themselves are still accessible (same routes) — just the mutation controls are hidden.

### 10. Login Redirect Logic (`src/app/login/page.tsx`)

After successful login, redirect based on API response:
- `isAdmin === true` → redirect to `/dashboard/profiles` (admin must pick a profile)
- `isAdmin === false && currentProfileId !== null` → redirect to `/dashboard`
- `isAdmin === false && currentProfileId === null` → redirect to `/dashboard` (page shows empty state: "You have not been added to a profile yet")

### 11. Non-Admin Empty State

In `src/app/dashboard/page.tsx` (leaderboard) and other pages: if `session.currentProfileId` is null and `!isAdmin`, show a centered message: "You haven't been added to a profile yet. Please contact the admin." No redirect loop.

---

## Implementation Details

### Migration File

Use `prisma migrate dev --name add-profiles`. The generated migration SQL will need manual edits to:
- Insert the Default profile with a fixed id (e.g., use `gen_random_uuid()` or a literal cuid)
- Run `UPDATE "Player" SET "profileId" = '<default_id>'`
- Run `UPDATE "Bet" SET "profileId" = '<default_id>'`
- Then add `NOT NULL` constraint on those columns

Alternatively, write a custom migration SQL file directly under `prisma/migrations/`.

### Session Cookie Update Pattern

The session cookie is updated by re-calling `cookieStore.set('session', JSON.stringify(newSession), { ...sameOptions })`. Reuse the same cookie options from `src/app/api/login/route.ts`.

### Admin Check Pattern

```typescript
import { getSession, isAdmin } from "@/lib/auth";

const session = await getSession();
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
```

### Non-Admin Read-Only Check Pattern

```typescript
if (!isAdmin(session) && request.method !== "GET") {
  return NextResponse.json({ error: "Read-only access" }, { status: 403 });
}
```

### Prisma Query Scoping Pattern

```typescript
const { currentProfileId } = session;
if (!currentProfileId) return NextResponse.json({ error: "No profile selected" }, { status: 403 });

const players = await prisma.player.findMany({
  where: { profileId: currentProfileId },
  orderBy: { name: "asc" },
});
```

---

## Edge Cases & Constraints

- **Admin has no profile**: `session.currentProfileId` is null after login. All data routes return 403 until admin picks a profile via `/dashboard/profiles`. This prevents accidental data access across profiles.
- **Non-admin not in a profile**: `user.profileId` is null. Show empty state — do not crash or redirect loop. API routes return 403 for mutation attempts.
- **Player name uniqueness**: Names must be unique **per profile** (not globally). The `@@unique([name, profileId])` constraint handles this. Error message: "A player with this name already exists in this profile."
- **Profile name**: Not required to be globally unique — two profiles can share the same name.
- **Admin creating a user**: Username must be globally unique across all users. Validate against all `User` records.
- **Admin cannot be assigned to a profile**: `User.profileId` is only set for non-admin users. The admin's `profileId` stays null always.
- **Switching profiles**: Admin's `currentProfileId` in session changes but their `User.profileId` in DB remains null. Profile context is session-only for admin.
- **No profile deletion**: Do not implement DELETE for profiles.
- **IST timestamps**: Match date inputs and stored dates must use `+05:30` offset per CLAUDE.md.

---

## Testing

No automated tests required. Manual test plan:

1. Login as `admin` → lands on `/dashboard/profiles`
2. Create two profiles: "Cricket" and "Football"
3. Switch to "Cricket" → lands on `/dashboard` showing Cricket data
4. Create players/bets in Cricket → verify they don't appear when switching to Football
5. Rename "Cricket" to "IPL" → verify updated in nav
6. Add a non-admin user to "IPL" profile
7. Logout, login as non-admin → auto-lands on IPL dashboard
8. Verify non-admin sees players/bets but no create/edit/delete controls
9. Verify non-admin API calls: `POST /api/players` returns 403
10. Create another non-admin user with no profile → verify empty state message on login

---

## Out of Scope

- Profile deletion
- Transferring data between profiles
- Non-admin users in multiple profiles
- Email-based user invitations or password reset
- Admin seeing cross-profile aggregated data
- CSRF protection (not currently implemented)
- Removing the `/signup` page from the UI (just disable its API — the page can remain)
