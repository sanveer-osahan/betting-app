import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-4xl font-bold">Betting App</h1>
      <p className="text-gray-400">Welcome! Sign up or log in to get started.</p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Sign Up
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition font-medium"
        >
          Log In
        </Link>
      </div>
    </div>
  );
}
