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

## Tech Stack
- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 4
- PostgreSQL + Prisma ORM
- bcryptjs for password hashing
- Dev server runs on port 3003
