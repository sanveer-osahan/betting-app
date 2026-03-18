import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const admin = isAdmin(session);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold">
            Betting App
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{session.name}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <div className="border-b border-gray-800 bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 flex gap-1">
          {admin ? (
            <>
              <Link
                href="/dashboard/users"
                className="px-4 py-2.5 text-sm hover:bg-gray-800 transition text-gray-300 hover:text-white"
              >
                Users
              </Link>
              <Link
                href="/dashboard/teams"
                className="px-4 py-2.5 text-sm hover:bg-gray-800 transition text-gray-300 hover:text-white"
              >
                Teams
              </Link>
              <Link
                href="/dashboard/schedules"
                className="px-4 py-2.5 text-sm hover:bg-gray-800 transition text-gray-300 hover:text-white"
              >
                Schedules
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-2.5 text-sm hover:bg-gray-800 transition text-gray-300 hover:text-white"
              >
                Leaderboard
              </Link>
              <Link
                href="/dashboard/bets"
                className="px-4 py-2.5 text-sm hover:bg-gray-800 transition text-gray-300 hover:text-white"
              >
                Bets
              </Link>
              <Link
                href="/dashboard/my-teams"
                className="px-4 py-2.5 text-sm hover:bg-gray-800 transition text-gray-300 hover:text-white"
              >
                Teams
              </Link>
            </>
          )}
        </div>
      </div>
      <main className="flex-1">{children}</main>
    </div>
  );
}

function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        cookieStore.delete("session");
        const { redirect } = await import("next/navigation");
        redirect("/login");
      }}
    >
      <button
        type="submit"
        className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg hover:bg-gray-700 transition"
      >
        Log out
      </button>
    </form>
  );
}
