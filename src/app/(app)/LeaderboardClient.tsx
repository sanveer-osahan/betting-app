"use client";

import { useEffect, useState } from "react";

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  totalAmount: number;
}

export default function LeaderboardClient({
  isAdmin,
  hasProfile,
}: {
  isAdmin: boolean;
  hasProfile: boolean;
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasProfile) {
      setLoading(false);
      return;
    }
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hasProfile]);

  if (!hasProfile && !isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 text-sm text-center px-4">
          You haven&apos;t been added to a profile yet. Please contact the admin.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

      {entries.length === 0 ? (
        <p className="text-gray-500 text-sm">No players yet. Add players and complete some bets to see the leaderboard.</p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="grid grid-cols-[3rem_1fr_auto] gap-2 px-4 py-2.5 border-b border-gray-800 text-xs text-gray-500 font-medium">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Total</span>
          </div>
          {entries.map((entry, index) => (
            <div
              key={entry.playerId}
              className="grid grid-cols-[3rem_1fr_auto] gap-2 px-4 py-3 border-b border-gray-800/50 last:border-b-0"
            >
              <span className="text-sm text-gray-500">{index + 1}</span>
              <span className="text-sm font-medium">{entry.playerName}</span>
              <span
                className={`text-sm font-mono font-medium text-right ${
                  entry.totalAmount > 0
                    ? "text-green-400"
                    : entry.totalAmount < 0
                      ? "text-red-400"
                      : "text-gray-400"
                }`}
              >
                {entry.totalAmount > 0 && "+"}
                {entry.totalAmount < 0 && "-"}
                ₹{Math.abs(entry.totalAmount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
