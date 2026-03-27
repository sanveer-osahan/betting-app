"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { computeValidation, computePayouts } from "@/lib/betting";

interface PlayerInfo {
  id: string;
  name: string;
}

interface EntryInfo {
  id: string;
  team: string;
  amount: number;
  result: number | null;
  player: PlayerInfo;
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

export default function BetDetailClient({ isAdmin }: { isAdmin: boolean }) {
  const params = useParams();
  const router = useRouter();
  const betId = params.betId as string;

  const [bet, setBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState<PlayerInfo[]>([]);
  const [error, setError] = useState("");

  // Add entry form
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<"team1" | "team2">("team1");
  const [entryAmount, setEntryAmount] = useState(100);
  const [addingEntry, setAddingEntry] = useState(false);

  // Edit entry
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editTeam, setEditTeam] = useState<"team1" | "team2">("team1");
  const [editAmount, setEditAmount] = useState(100);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete entry
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [deletingEntry, setDeletingEntry] = useState(false);

  // Complete bet
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeTeam, setCompleteTeam] = useState<"team1" | "team2">("team1");
  const [completing, setCompleting] = useState(false);

  const fetchBet = useCallback(() => {
    fetch(`/api/bets/${betId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setBet(data))
      .catch(() => setBet(null))
      .finally(() => setLoading(false));
  }, [betId]);

  const fetchPlayers = useCallback(() => {
    fetch("/api/players")
      .then((res) => res.json())
      .then((data) => setAllPlayers(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBet();
    fetchPlayers();
  }, [fetchBet, fetchPlayers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <button
          onClick={() => router.push("/bets")}
          className="text-sm text-gray-400 hover:text-white mb-4 inline-block"
        >
          &larr; Back to Bets
        </button>
        <p className="text-gray-500">Bet not found.</p>
      </div>
    );
  }

  const isOpen = bet.status === "open";
  const team1Entries = bet.entries.filter((e) => e.team === "team1");
  const team2Entries = bet.entries.filter((e) => e.team === "team2");
  const entriesInput = bet.entries.map((e) => ({ team: e.team, amount: e.amount }));
  const validation = computeValidation(entriesInput);

  const bothTeamsHaveEntries = team1Entries.length > 0 && team2Entries.length > 0;
  const totalPool = bothTeamsHaveEntries
    ? bet.entries.reduce((sum, e) => sum + e.amount, 0)
    : 0;

  const scenario1 = bothTeamsHaveEntries ? computePayouts(entriesInput, "team1") : null;
  const scenario2 = bothTeamsHaveEntries ? computePayouts(entriesInput, "team2") : null;

  const entryPlayerIds = new Set(bet.entries.map((e) => e.player.id));
  const availablePlayers = allPlayers.filter((p) => !entryPlayerIds.has(p.id));

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlayerId) return;
    setAddingEntry(true);
    setError("");

    try {
      const res = await fetch(`/api/bets/${betId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: selectedPlayerId,
          team: selectedTeam,
          amount: entryAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add entry");
        return;
      }
      setSelectedPlayerId("");
      setEntryAmount(100);
      fetchBet();
    } catch {
      setError("Something went wrong");
    } finally {
      setAddingEntry(false);
    }
  }

  function startEdit(entry: EntryInfo) {
    setEditingEntryId(entry.id);
    setEditTeam(entry.team as "team1" | "team2");
    setEditAmount(entry.amount);
  }

  async function handleSaveEdit() {
    if (!editingEntryId) return;
    setSavingEdit(true);
    setError("");

    try {
      const res = await fetch(`/api/bets/${betId}/entries/${editingEntryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: editTeam, amount: editAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update entry");
        return;
      }
      setEditingEntryId(null);
      fetchBet();
    } catch {
      setError("Something went wrong");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteEntry() {
    if (!deleteEntryId) return;
    setDeletingEntry(true);
    setError("");

    try {
      const res = await fetch(`/api/bets/${betId}/entries/${deleteEntryId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete entry");
        setDeleteEntryId(null);
        return;
      }
      setDeleteEntryId(null);
      fetchBet();
    } catch {
      setError("Something went wrong");
    } finally {
      setDeletingEntry(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    setError("");

    try {
      const res = await fetch(`/api/bets/${betId}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winningTeam: completeTeam }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.deficitTeamName
            ? `Bet is not valid. ${data.deficitTeamName} needs ₹${Math.ceil(data.deficit)} more.`
            : data.error || "Failed to complete bet"
        );
        return;
      }
      setShowCompleteModal(false);
      fetchBet();
    } catch {
      setError("Something went wrong");
    } finally {
      setCompleting(false);
    }
  }

  const deficitTeamName =
    validation.deficitTeam === "team1"
      ? bet.team1Name
      : validation.deficitTeam === "team2"
        ? bet.team2Name
        : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <button
        onClick={() => router.push("/bets")}
        className="text-sm text-gray-400 hover:text-white mb-4 inline-block"
      >
        &larr; Back to Bets
      </button>

      <div className="text-sm space-y-4">
        {/* Header */}
        <div className="text-center">
          <p className="text-lg font-bold">
            {bet.team1Name}
            <span className="text-gray-500 mx-2">vs</span>
            {bet.team2Name}
          </p>
          <p className="text-xs text-gray-500 mt-1">{formatIST(bet.matchDate)}</p>
          {!isOpen && bet.winningTeam && (
            <span className="inline-block mt-2 text-xs text-green-400 bg-green-900/30 px-3 py-1 rounded">
              Winner: {bet.winningTeam === "team1" ? bet.team1Name : bet.team2Name}
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg p-3 border bg-red-900/30 border-red-800 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Entries - Two columns */}
        <div className="grid grid-cols-2 gap-3">
          {(["team1", "team2"] as const).map((teamKey) => {
            const teamName = teamKey === "team1" ? bet.team1Name : bet.team2Name;
            const teamEntries = teamKey === "team1" ? team1Entries : team2Entries;
            const isWinner = bet.winningTeam === teamKey;
            return (
              <div
                key={teamKey}
                className={`bg-gray-900 border rounded-lg p-3 ${
                  isWinner ? "border-green-700" : "border-gray-800"
                }`}
              >
                <h2 className="text-sm font-bold mb-2">
                  {teamName}
                  <span className="text-gray-500 text-xs font-normal ml-1">
                    ({teamEntries.length})
                  </span>
                </h2>
                {teamEntries.length === 0 ? (
                  <p className="text-gray-600 text-xs">No entries</p>
                ) : (
                  <div className="space-y-2">
                    {teamEntries.map((entry) => {
                      const isEditing = editingEntryId === entry.id;
                      return (
                        <div key={entry.id} className="bg-gray-800 rounded-lg px-2 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs truncate mr-1">
                              {entry.player.name}
                            </span>
                            {isOpen && isAdmin && !isEditing && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => startEdit(entry)}
                                  className="text-[10px] text-blue-400 hover:text-blue-300"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeleteEntryId(entry.id)}
                                  className="text-[10px] text-red-400 hover:text-red-300"
                                >
                                  Del
                                </button>
                              </div>
                            )}
                          </div>
                          {isEditing ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setEditAmount(Math.max(100, editAmount - 50))}
                                  className="w-7 h-7 rounded bg-gray-700 active:bg-gray-600 flex items-center justify-center transition text-xs"
                                >
                                  −
                                </button>
                                <span className="w-14 text-center font-mono text-xs">₹{editAmount}</span>
                                <button
                                  onClick={() => setEditAmount(editAmount + 50)}
                                  className="w-7 h-7 rounded bg-gray-700 active:bg-gray-600 flex items-center justify-center transition text-xs"
                                >
                                  +
                                </button>
                              </div>
                              <select
                                value={editTeam}
                                onChange={(e) => setEditTeam(e.target.value as "team1" | "team2")}
                                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs"
                              >
                                <option value="team1">{bet.team1Name}</option>
                                <option value="team2">{bet.team2Name}</option>
                              </select>
                              <div className="flex gap-1">
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={savingEdit}
                                  className="flex-1 py-1 bg-green-600 rounded text-[10px] font-medium disabled:opacity-50"
                                >
                                  {savingEdit ? "..." : "Save"}
                                </button>
                                <button
                                  onClick={() => setEditingEntryId(null)}
                                  className="flex-1 py-1 bg-gray-700 rounded text-[10px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 text-center font-mono">
                              ₹{entry.amount}
                              {!isOpen && entry.result != null && (
                                <span
                                  className={`ml-2 font-medium ${
                                    entry.result >= 0 ? "text-green-400" : "text-red-400"
                                  }`}
                                >
                                  ({entry.result >= 0 ? "+" : ""}
                                  {entry.result})
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Validation Status (open bets only) */}
        {isOpen && bothTeamsHaveEntries && (
          <div
            className={`rounded-lg p-3 border text-center ${
              validation.valid
                ? "bg-green-900/30 border-green-800 text-green-400"
                : "bg-red-900/30 border-red-800 text-red-400"
            }`}
          >
            {validation.valid ? (
              <p className="text-xs font-medium">
                Bets are valid — payouts are fair for all players.
              </p>
            ) : (
              <div>
                <p className="text-xs font-bold mb-1">Bets are not valid</p>
                <p className="text-xs">
                  {deficitTeamName
                    ? `${deficitTeamName} needs ₹${Math.ceil(validation.deficit)} more to make this bet fair.`
                    : "Both teams need entries."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Scenarios (open bets only) */}
        {isOpen && bothTeamsHaveEntries && (
          <div className="grid grid-cols-2 gap-3">
            {(["team1", "team2"] as const).map((teamKey) => {
              const teamName = teamKey === "team1" ? bet.team1Name : bet.team2Name;
              const scenario = teamKey === "team1" ? scenario1 : scenario2;
              return (
                <div key={teamKey} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                  <h2 className="text-sm font-bold mb-0.5">{teamName} Wins</h2>
                  <p className="text-gray-500 text-xs mb-2">Pool: ₹{totalPool}</p>
                  {!scenario ? (
                    <p className="text-gray-600 text-xs">Both teams need entries.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {scenario.map((s, idx) => {
                        const entry = bet.entries[idx];
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 min-w-0">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  entry.team === "team1" ? "bg-blue-400" : "bg-orange-400"
                                }`}
                              />
                              <span className="truncate">{entry.player.name}</span>
                            </div>
                            <span
                              className={`font-mono font-medium shrink-0 ml-1 ${
                                s.result >= 0 ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {s.result >= 0 ? "+" : ""}
                              {s.result}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Entry Form (admin + open bets only) */}
        {isOpen && isAdmin && (
          <form onSubmit={handleAddEntry} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <h3 className="text-xs font-semibold mb-2">Add Player Entry</h3>
            <div className="space-y-2">
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs focus:outline-none focus:border-gray-500"
              >
                <option value="">Select player...</option>
                {availablePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value as "team1" | "team2")}
                  className="px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs focus:outline-none focus:border-gray-500"
                >
                  <option value="team1">{bet.team1Name}</option>
                  <option value="team2">{bet.team2Name}</option>
                </select>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEntryAmount(Math.max(100, entryAmount - 50))}
                    className="w-8 h-8 rounded bg-gray-800 border border-gray-700 active:bg-gray-700 flex items-center justify-center text-xs"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-mono text-xs">₹{entryAmount}</span>
                  <button
                    type="button"
                    onClick={() => setEntryAmount(entryAmount + 50)}
                    className="w-8 h-8 rounded bg-gray-800 border border-gray-700 active:bg-gray-700 flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={addingEntry || !selectedPlayerId}
                className="w-full py-2 bg-blue-600 rounded-lg text-xs font-medium active:bg-blue-700 transition disabled:opacity-50"
              >
                {addingEntry ? "Adding..." : "Add Entry"}
              </button>
            </div>
          </form>
        )}

        {/* Complete Bet Button (admin + open bets only) */}
        {isOpen && isAdmin && (
          <button
            onClick={() => setShowCompleteModal(true)}
            disabled={!validation.valid}
            className="w-full py-2.5 bg-green-600 rounded-lg text-sm font-medium active:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Bet
          </button>
        )}
      </div>

      {/* Delete Entry Confirmation */}
      {deleteEntryId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-sm font-bold mb-2">Remove Entry</h3>
            <p className="text-xs text-gray-400 mb-4">Remove this player&apos;s entry from the bet?</p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteEntry}
                disabled={deletingEntry}
                className="flex-1 py-2 bg-red-600 rounded-lg text-sm font-medium active:bg-red-700 transition disabled:opacity-50"
              >
                {deletingEntry ? "Removing..." : "Remove"}
              </button>
              <button
                onClick={() => setDeleteEntryId(null)}
                className="flex-1 py-2 bg-gray-800 rounded-lg text-sm active:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Bet Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-sm font-bold mb-2">Complete Bet</h3>
            <p className="text-xs text-gray-400 mb-3">
              Select the winning team. This action is permanent.
            </p>
            <select
              value={completeTeam}
              onChange={(e) => setCompleteTeam(e.target.value as "team1" | "team2")}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm mb-4 focus:outline-none focus:border-gray-500"
            >
              <option value="team1">{bet.team1Name}</option>
              <option value="team2">{bet.team2Name}</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleComplete}
                disabled={completing}
                className="flex-1 py-2 bg-green-600 rounded-lg text-sm font-medium active:bg-green-700 transition disabled:opacity-50"
              >
                {completing ? "Completing..." : "Confirm"}
              </button>
              <button
                onClick={() => setShowCompleteModal(false)}
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
