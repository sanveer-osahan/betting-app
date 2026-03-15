# Betting App

## Admin Role
- Admin access is determined by username: the user with username `admin` has admin privileges.
- This is not traditional RBAC — it's a simple username check since this is a small, non-production app.
- Whenever "admin roles and access" is mentioned, it refers to the user with username `admin`.

## Admin-Only Features
The admin user has access to special tabs in the dashboard:
- **Users** — Create, view, edit, and delete users
- **Teams** — (future)
- **Schedules** — (future)

## UI Rules
- Never display created/updated timestamps for entities in the UI.

## Timezone
- All timestamps everywhere — in the database, APIs, JSON files, and UI — must be in IST (Indian Standard Time, UTC+5:30).
- Use the `+05:30` offset in ISO 8601 format (e.g., `2026-03-28T15:30:00+05:30`), never UTC/Z.

## Tech Stack
- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 4
- PostgreSQL + Prisma ORM
- bcryptjs for password hashing
- Dev server runs on port 3003
