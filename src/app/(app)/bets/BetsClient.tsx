"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface EntryInfo {
  id: string;
  team: string;
  amount: number;
  player: { id: string; name: string };
}

interface Bet {
  id: string;
  team1Name: string;
  team2Name: string;
  matchDate: string;
  status: string;
  winningTeam: string | null;
  entries: EntryInfo[];
}

function formatIST(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function BetsClient({ isAdmin }: { isAdmin: boolean }) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [team1Name, setTeam1Name] = useState("");
  const [team2Name, setTeam2Name] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    open: true,
    complete: true,
  });

  const fetchBets = useCallback(() => {
    fetch("/api/bets")
      .then((res) => res.json())
      .then((data) => setBets(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  const openBets = bets.filter((b) => b.status === "open");
  const completeBets = bets.filter((b) => b.status === "complete");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!team1Name.trim() || !team2Name.trim() || !matchDate) return;
    setCreating(true);
    setError("");

    try {
      const istDate = matchDate + ":00+05:30";
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1Name: team1Name.trim(),
          team2Name: team2Name.trim(),
          matchDate: istDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create bet");
        return;
      }
      setTeam1Name("");
      setTeam2Name("");
      setMatchDate("");
      fetchBets();
    } catch {
      setError("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/bets/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete bet");
        setDeleteId(null);
        return;
      }
      setDeleteId(null);
      fetchBets();
    } catch {
      setError("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading bets...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Bets</h1>

      {/* Create Bet Form (admin only) */}
      {isAdmin && (
        <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold mb-3">Create New Bet</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                placeholder="Team 1"
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-gray-500"
              />
              <input
                type="text"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                placeholder="Team 2"
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            <input
              type="datetime-local"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-gray-500"
            />
            <button
              type="submit"
              disabled={creating || !team1Name.trim() || !team2Name.trim() || !matchDate}
              className="w-full py-2.5 bg-blue-600 rounded-lg text-sm font-medium active:bg-blue-700 transition disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Bet"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="rounded-lg p-3 border bg-red-900/30 border-red-800 text-red-400 text-xs text-center mb-4">
          {error}
        </div>
      )}

      {/* Collapsible Sections */}
      <div className="space-y-4">
        <CollapsibleSection
          title="Open Bets"
          count={openBets.length}
          expanded={expandedSections.open}
          onToggle={() => toggleSection("open")}
        >
          {openBets.length === 0 ? (
            <p className="text-gray-600 text-sm py-2">No open bets</p>
          ) : (
            <div className="space-y-3">
              {openBets.map((bet) => (
                <div key={bet.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <Link
                    href={`/bets/${bet.id}`}
                    className="block hover:opacity-80 transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {bet.team1Name} <span className="text-gray-500">vs</span> {bet.team2Name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{formatIST(bet.matchDate)}</p>
                    <p className="text-xs text-gray-500 mt-1">{bet.entries.length} entries</p>
                  </Link>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteId(bet.id);
                      }}
                      className="mt-2 text-xs text-red-400 hover:text-red-300 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Completed Bets"
          count={completeBets.length}
          expanded={expandedSections.complete}
          onToggle={() => toggleSection("complete")}
        >
          {completeBets.length === 0 ? (
            <p className="text-gray-600 text-sm py-2">No completed bets</p>
          ) : (
            <div className="space-y-3">
              {completeBets.map((bet) => {
                const winnerName = bet.winningTeam === "team1" ? bet.team1Name : bet.team2Name;
                return (
                  <Link
                    key={bet.id}
                    href={`/bets/${bet.id}`}
                    className="block bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {bet.team1Name} <span className="text-gray-500">vs</span> {bet.team2Name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{formatIST(bet.matchDate)}</p>
                    <p className="text-xs text-green-400 mt-1">
                      Winner: {winnerName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{bet.entries.length} entries</p>
                  </Link>
                );
              })}
            </div>
          )}
        </CollapsibleSection>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-sm font-bold mb-2">Delete Bet</h3>
            <p className="text-xs text-gray-400 mb-4">
              Are you sure you want to delete this bet and all its entries?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 bg-red-600 rounded-lg text-sm font-medium active:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 bg-gray-800 rounded-lg text-sm active:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({
  title,
  count,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
