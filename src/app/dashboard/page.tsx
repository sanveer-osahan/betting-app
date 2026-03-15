import { getSession, isAdmin } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">
        Welcome, {session?.name ?? "User"}
      </h1>
      <p className="text-gray-400 mb-6">
        {isAdmin(session)
          ? "You have admin access. Use the tabs above to manage the app."
          : "Betting features coming soon."}
      </p>

      {isAdmin(session) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard/users"
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-blue-600 transition"
          >
            <h2 className="font-semibold mb-1">Users</h2>
            <p className="text-sm text-gray-400">
              Create, edit, and manage users
            </p>
          </Link>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 opacity-50 cursor-not-allowed">
            <h2 className="font-semibold mb-1">Teams</h2>
            <p className="text-sm text-gray-400">Coming soon</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 opacity-50 cursor-not-allowed">
            <h2 className="font-semibold mb-1">Schedules</h2>
            <p className="text-sm text-gray-400">Coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
