import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-gray-400">You&apos;re logged in! Betting features coming soon.</p>
      <Link
        href="/"
        className="text-blue-400 hover:underline text-sm"
      >
        Back to home
      </Link>
    </div>
  );
}
