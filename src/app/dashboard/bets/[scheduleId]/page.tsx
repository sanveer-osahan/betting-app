"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface TeamInfo {
  id: string;
  fullName: string;
  shortName: string;
  teamColor: string;
}

interface BetUser {
  id: string;
  name: string;
  username: string;
}

interface BetInfo {
  id: string;
  teamId: string;
  amount: number;
  userId: string;
  user: BetUser;
}

interface Schedule {
  id: string;
  team1: TeamInfo;
  team2: TeamInfo;
  startsAt: string;
  bets: BetInfo[];
}

interface Player {
  betId: string | null;
  userId: string;
  name: string;
  team: "1" | "2";
  bet: number;
  isCurrentUser: boolean;
}

export default function ScheduleBettingPage() {
  const params = useParams();
  const router = useRouter();
  const scheduleId = params.scheduleId as string;

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState<"view" | "editing" | "placing">("view");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  // Snapshot of players before editing, for cancel
  const [snapshot, setSnapshot] = useState<Player[]>([]);

  const bettingOpen = schedule ? new Date() <= new Date(schedule.startsAt) : false;

  useEffect(() => {
    try {
      const sessionCookie = document.cookie
        .split("; ")
        .find((c) => c.startsWith("session="));
      if (sessionCookie) {
        const session = JSON.parse(
          decodeURIComponent(sessionCookie.split("=").slice(1).join("="))
        );
        setCurrentUserId(session.id);
      }
    } catch {
      // ignore
    }
  }, []);

  const buildPlayers = useCallback(
    (data: Schedule, userId: string): Player[] => {
      return data.bets.map((bet) => ({
        betId: bet.id,
        userId: bet.userId,
        name: bet.user.name,
        team: bet.teamId === data.team1.id ? "1" : "2",
        bet: bet.amount,
        isCurrentUser: bet.userId === userId,
      }));
    },
    []
  );

  useEffect(() => {
    if (!currentUserId) return;
    fetch("/api/schedules")
      .then((res) => res.json())
      .then((data: Schedule[]) => {
        const s = data.find((item) => item.id === scheduleId);
        if (s) {
          setSchedule(s);
          setPlayers(buildPlayers(s, currentUserId));
        }
      })
      .catch(() => setError("Failed to load schedule"))
      .finally(() => setLoading(false));
  }, [scheduleId, currentUserId, buildPlayers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <button
          onClick={() => router.push("/dashboard/bets")}
          className="text-sm text-gray-400 hover:text-white mb-4 inline-block"
        >
          &larr; Back to Bets
        </button>
        <p className="text-gray-500">Schedule not found.</p>
      </div>
    );
  }

  const team1 = schedule.team1;
  const team2 = schedule.team2;
  const userBet = players.find((p) => p.isCurrentUser);
  const hasExistingBet = userBet && userBet.betId;
  const isEditing = mode === "editing" || mode === "placing";

  const team1Players = players.filter((p) => p.team === "1");
  const team2Players = players.filter((p) => p.team === "2");
  const bothTeamsHavePlayers = team1Players.length > 0 && team2Players.length > 0;
  const totalAmount1 = team1Players.reduce((sum, p) => sum + p.bet, 0);
  const totalAmount2 = team2Players.reduce((sum, p) => sum + p.bet, 0);
  const totalPool = bothTeamsHavePlayers ? totalAmount1 + totalAmount2 : 0;

  function computeValidation(): {
    valid: boolean;
    deficit: number;
    deficitTeam: "1" | "2" | null;
  } {
    if (!bothTeamsHavePlayers) {
      return { valid: false, deficit: 0, deficitTeam: null };
    }
    if (totalAmount1 === totalAmount2) {
      return { valid: true, deficit: 0, deficitTeam: null };
    }

    const higherTeam = totalAmount1 > totalAmount2 ? "1" : "2";
    const lowerTeam = higherTeam === "1" ? "2" : "1";
    const higherAmount = higherTeam === "1" ? totalAmount1 : totalAmount2;
    const lowerAmount = higherTeam === "1" ? totalAmount2 : totalAmount1;
    const higherCount = higherTeam === "1" ? team1Players.length : team2Players.length;
    const lowerCount = higherTeam === "1" ? team2Players.length : team1Players.length;

    const requiredAmount =
      higherCount > lowerCount
        ? (higherAmount / higherCount) * lowerCount
        : higherAmount;

    if (lowerAmount >= requiredAmount) {
      return { valid: true, deficit: 0, deficitTeam: null };
    }
    return {
      valid: false,
      deficit: requiredAmount - lowerAmount,
      deficitTeam: lowerTeam,
    };
  }

  const validation = computeValidation();

  function computeScenario(winningTeam: "1" | "2") {
    if (!bothTeamsHavePlayers) return null;
    const winningBets = players
      .filter((p) => p.team === winningTeam)
      .reduce((sum, p) => sum + p.bet, 0);

    return players.map((p) => {
      if (p.team === winningTeam) {
        const payout = (p.bet / winningBets) * totalPool;
        return { ...p, profit: payout - p.bet };
      }
      return { ...p, profit: -p.bet };
    });
  }

  const scenario1 = computeScenario("1");
  const scenario2 = computeScenario("2");

  function handlePlaceBet() {
    setSnapshot([...players]);
    // Add user to team1 with 100
    setPlayers((prev) => [
      ...prev,
      {
        betId: null,
        userId: currentUserId,
        name: "You",
        team: "1",
        bet: 100,
        isCurrentUser: true,
      },
    ]);
    setMode("placing");
  }

  function handleEditBet() {
    setSnapshot(players.map((p) => ({ ...p })));
    setMode("editing");
  }

  function handleCancel() {
    setPlayers(snapshot);
    setMode("view");
    setError("");
  }

  function updateMyBet(delta: number) {
    setPlayers((prev) =>
      prev.map((p) =>
        p.isCurrentUser
          ? { ...p, bet: Math.max(100, p.bet + delta) }
          : p
      )
    );
  }

  function switchMyTeam() {
    setPlayers((prev) =>
      prev.map((p) =>
        p.isCurrentUser
          ? { ...p, team: p.team === "1" ? "2" : "1" }
          : p
      )
    );
  }

  async function handleSave() {
    const myPlayer = players.find((p) => p.isCurrentUser);
    if (!myPlayer) return;

    const teamId = myPlayer.team === "1" ? team1.id : team2.id;
    setSaving(true);
    setError("");

    try {
      if (mode === "placing") {
        const res = await fetch("/api/bets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduleId: schedule!.id,
            teamId,
            amount: myPlayer.bet,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to place bet");
          return;
        }
      } else if (mode === "editing" && hasExistingBet) {
        const res = await fetch(`/api/bets/${userBet!.betId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId, amount: myPlayer.bet }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to update bet");
          return;
        }
      }

      // Refresh data
      const res = await fetch("/api/schedules");
      const allSchedules: Schedule[] = await res.json();
      const updated = allSchedules.find((s) => s.id === scheduleId);
      if (updated) {
        setSchedule(updated);
        setPlayers(buildPlayers(updated, currentUserId));
      }
      setMode("view");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveBet() {
    if (!hasExistingBet) return;
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/bets/${userBet!.betId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to remove bet");
        return;
      }

      // Refresh data
      const res2 = await fetch("/api/schedules");
      const allSchedules: Schedule[] = await res2.json();
      const updated = allSchedules.find((s) => s.id === scheduleId);
      if (updated) {
        setSchedule(updated);
        setPlayers(buildPlayers(updated, currentUserId));
      }
      setMode("view");
    } catch {
      setError("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }

  const deficitTeamInfo = validation.deficitTeam === "1" ? team1 : validation.deficitTeam === "2" ? team2 : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard/bets")}
        className="text-sm text-gray-400 hover:text-white mb-4 inline-block"
      >
        &larr; Back to Bets
      </button>

      <div className="text-sm space-y-4">
        {/* Team header */}
        <div className="text-center">
          <p className="text-lg font-bold">
            <span style={{ color: team1.teamColor }}>{team1.shortName}</span>
            <span className="text-gray-500 mx-2">vs</span>
            <span style={{ color: team2.teamColor }}>{team2.shortName}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(schedule.startsAt).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          {!bettingOpen && (
            <span className="inline-block mt-2 text-xs text-red-400 bg-red-900/30 px-3 py-1 rounded">
              Betting Closed
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg p-3 border bg-red-900/30 border-red-800 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Teams - two columns */}
        <div className="grid grid-cols-2 gap-3">
          {(["1", "2"] as const).map((teamKey) => {
            const teamInfo = teamKey === "1" ? team1 : team2;
            const teamPlayers = teamKey === "1" ? team1Players : team2Players;
            return (
              <div
                key={teamKey}
                className="bg-gray-900 border border-gray-800 rounded-lg p-3"
              >
                <h2
                  className="text-sm font-bold mb-2"
                  style={{ color: teamInfo.teamColor }}
                >
                  {teamInfo.shortName}
                  <span className="text-gray-500 text-xs font-normal ml-1">
                    ({teamPlayers.length})
                  </span>
                </h2>
                {teamPlayers.length === 0 ? (
                  <p className="text-gray-600 text-xs">No bets</p>
                ) : (
                  <div className="space-y-2">
                    {teamPlayers.map((p, idx) => (
                      <div
                        key={p.userId + idx}
                        className={`bg-gray-800 rounded-lg px-2 py-2 ${
                          p.isCurrentUser ? "ring-1 ring-blue-500/50" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-medium text-xs truncate mr-1">
                            {p.isCurrentUser ? `${p.name} (You)` : p.name}
                          </span>
                          {p.isCurrentUser && isEditing && (
                            <button
                              onClick={switchMyTeam}
                              className="px-1.5 py-0.5 text-[10px] rounded font-medium transition"
                              style={{
                                backgroundColor:
                                  teamKey === "1"
                                    ? `${team2.teamColor}33`
                                    : `${team1.teamColor}33`,
                                color:
                                  teamKey === "1"
                                    ? team2.teamColor
                                    : team1.teamColor,
                              }}
                            >
                              &rarr;{teamKey === "1" ? team2.shortName : team1.shortName}
                            </button>
                          )}
                        </div>
                        {p.isCurrentUser && isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => updateMyBet(-50)}
                              className="w-7 h-7 rounded bg-gray-700 active:bg-gray-600 flex items-center justify-center transition text-xs"
                            >
                              −
                            </button>
                            <span className="w-14 text-center font-mono text-xs">
                              ₹{p.bet}
                            </span>
                            <button
                              onClick={() => updateMyBet(50)}
                              className="w-7 h-7 rounded bg-gray-700 active:bg-gray-600 flex items-center justify-center transition text-xs"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 text-center font-mono">
                            ₹{p.bet}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Validation Status */}
        {bothTeamsHavePlayers && (
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
                  {deficitTeamInfo
                    ? `${deficitTeamInfo.shortName} needs ₹${validation.deficit.toFixed(0)} more to make this bet fair.`
                    : "Both teams need bets."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Scenarios */}
        <div className="grid grid-cols-2 gap-3">
          {(["1", "2"] as const).map((teamKey) => {
            const teamInfo = teamKey === "1" ? team1 : team2;
            const scenario = teamKey === "1" ? scenario1 : scenario2;
            return (
              <div
                key={teamKey}
                className="bg-gray-900 border border-gray-800 rounded-lg p-3"
              >
                <h2
                  className="text-sm font-bold mb-0.5"
                  style={{ color: teamInfo.teamColor }}
                >
                  {teamInfo.shortName} Wins
                </h2>
                <p className="text-gray-500 text-xs mb-2">Pool: ₹{totalPool}</p>
                {!scenario ? (
                  <p className="text-gray-600 text-xs">Both teams need bets.</p>
                ) : (
                  <div className="space-y-1.5">
                    {scenario.map((p, idx) => (
                      <div
                        key={p.userId + idx}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                p.team === "1"
                                  ? team1.teamColor
                                  : team2.teamColor,
                            }}
                          />
                          <span className="truncate">
                            {p.isCurrentUser ? `${p.name} (You)` : p.name}
                          </span>
                        </div>
                        <span
                          className={`font-mono font-medium shrink-0 ml-1 ${
                            p.profit >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {p.profit >= 0 ? "+" : ""}
                          {p.profit.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {!isEditing && !userBet && bettingOpen && (
            <button
              onClick={handlePlaceBet}
              className="flex-1 py-2.5 bg-blue-600 rounded-lg active:bg-blue-700 transition font-medium text-sm"
            >
              Place Bet
            </button>
          )}

          {!isEditing && userBet && bettingOpen && (
            <>
              <button
                onClick={handleEditBet}
                className="flex-1 py-2.5 bg-blue-600 rounded-lg active:bg-blue-700 transition font-medium text-sm"
              >
                Edit Bet
              </button>
              <button
                onClick={handleRemoveBet}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 rounded-lg active:bg-red-700 transition font-medium text-sm disabled:opacity-50"
              >
                {deleting ? "Removing..." : "Remove Bet"}
              </button>
            </>
          )}

          {isEditing && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-green-600 rounded-lg active:bg-green-700 transition font-medium text-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Bet"}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 bg-gray-800 rounded-lg active:bg-gray-700 transition text-sm"
              >
                Cancel
              </button>
            </>
          )}

          {!bettingOpen && !isEditing && (
            <div className="flex-1 py-2.5 bg-gray-800 rounded-lg text-center text-gray-500 text-sm cursor-not-allowed">
              Betting Closed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
