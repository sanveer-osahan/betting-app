import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";
import Link from "next/link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            Betting App
          </Link>
          <div className="flex items-center gap-3">
            {session.currentProfileName && (
              isAdmin(session) ? (
                <Link
                  href="/profiles"
                  className="text-xs text-gray-400 hover:text-white transition truncate max-w-[120px]"
                >
                  {session.currentProfileName}
                </Link>
              ) : (
                <span className="text-xs text-gray-500 truncate max-w-[100px]">
                  {session.currentProfileName}
                </span>
              )
            )}
            {!isAdmin(session) && (
              <span className="text-[10px] text-gray-600 border border-gray-700 rounded px-1.5 py-0.5">
                View only
              </span>
            )}
            <span className="text-sm text-gray-400">{session.name}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <div className="border-b border-gray-800 bg-gray-950">
        <div className="max-w-lg mx-auto px-4 flex gap-1">
          <Link
            href="/"
            className="px-4 py-2.5 text-sm hover:bg-gray-800 transition text-gray-300 hover:text-white"
          >
            Leaderboard
          </Link>
          <Link
            href="/bets"
            className="px-4 py-2.5 text-sm hover:bg-gray-800 transition text-gray-300 hover:text-white"
          >
            Bets
          </Link>
          <Link
            href="/players"
            className="px-4 py-2.5 text-sm hover:bg-gray-800 transition text-gray-300 hover:text-white"
          >
            Players
          </Link>
          {isAdmin(session) && (
            <Link
              href="/profiles"
              className="px-4 py-2.5 text-sm hover:bg-gray-800 transition text-gray-300 hover:text-white"
            >
              Profiles
            </Link>
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
