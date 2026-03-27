"use client";

import { useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    };

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        return;
      }

      if (data.isAdmin) {
        router.push("/profiles");
      } else {
        router.push("/");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 p-8 rounded-xl w-full max-w-md space-y-5"
    >
      <h2 className="text-2xl font-bold text-center">Log In</h2>

      {registered && (
        <p className="text-green-400 text-sm text-center bg-green-950 p-2 rounded">
          Account created! Please log in.
        </p>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center bg-red-950 p-2 rounded">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-1">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Log In"}
      </button>

    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
