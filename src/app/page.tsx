"use client";

import { useState } from "react";
import Link from "next/link";

interface Player {
  id: string;
  name: string;
  team: "A" | "B";
  bet: number;
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerTeam, setNewPlayerTeam] = useState<"A" | "B">("A");

  const teamA = players.filter((p) => p.team === "A");
  const teamB = players.filter((p) => p.team === "B");
  const bothTeamsHavePlayers = teamA.length > 0 && teamB.length > 0;
  const totalPool = bothTeamsHavePlayers
    ? players.reduce((sum, p) => sum + p.bet, 0)
    : 0;

  function computeScenario(winningTeam: "A" | "B") {
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

  const scenarioA = computeScenario("A");
  const scenarioB = computeScenario("B");

  function addPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;
    setPlayers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, team: newPlayerTeam, bet: 100 },
    ]);
    setNewPlayerName("");
  }

  function updateBet(id: string, delta: number) {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, bet: Math.max(50, p.bet + delta) } : p
      )
    );
  }

  function switchTeam(id: string) {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, team: p.team === "A" ? "B" : "A" } : p
      )
    );
  }

  function removePlayer(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <span className="text-lg font-bold">Betting App</span>
        <Link
          href="/login"
          className="px-4 py-1.5 bg-blue-600 active:bg-blue-700 rounded-lg text-sm font-medium transition"
        >
          Login
        </Link>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-10">
        {/* Hero */}
        <section className="text-center py-8">
          <h1 className="text-3xl font-bold mb-3">
            Bet Smart. Win Big.
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
            Place bets on your favorite teams, track your profits, and climb the leaderboard.
          </p>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-lg font-bold mb-4 text-center">How It Works</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl mb-2">1</div>
              <p className="text-xs text-gray-300 font-medium">Place your bet</p>
              <p className="text-[10px] text-gray-500 mt-1">Pick a team and set your stake</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl mb-2">2</div>
              <p className="text-xs text-gray-300 font-medium">Watch the match</p>
              <p className="text-[10px] text-gray-500 mt-1">Follow the action live</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl mb-2">3</div>
              <p className="text-xs text-gray-300 font-medium">Collect winnings</p>
              <p className="text-[10px] text-gray-500 mt-1">Payouts split by bet share</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-lg font-bold mb-4 text-center">Features</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-bold text-green-400 mb-1">P&L Tally</h3>
              <p className="text-xs text-gray-400">Track your profits and losses across matches.</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-bold text-purple-400 mb-1">Leaderboards</h3>
              <p className="text-xs text-gray-400">Compete with others and climb the rankings.</p>
            </div>
          </div>
        </section>

        {/* Simulator */}
        <section>
          <h2 className="text-lg font-bold mb-1 text-center">See How Betting Works</h2>
          <p className="text-gray-500 text-xs text-center mb-4">
            This is a sample bet — play around to understand how payouts are calculated.
          </p>

          <div className="text-sm space-y-4">
            {/* Team header */}
            <div className="text-center">
              <p className="text-gray-400 text-xs">
                <span className="text-blue-400 font-semibold">Team A</span> vs{" "}
                <span className="text-yellow-400 font-semibold">Team B</span>
              </p>
            </div>

            {/* Add Player */}
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg p-3">
              <input
                type="text"
                placeholder="Name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                className="flex-1 min-w-0 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="flex rounded-lg overflow-hidden border border-gray-700 shrink-0">
                <button
                  onClick={() => setNewPlayerTeam("A")}
                  className={`px-3 py-2 text-xs font-medium transition ${
                    newPlayerTeam === "A"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => setNewPlayerTeam("B")}
                  className={`px-3 py-2 text-xs font-medium transition ${
                    newPlayerTeam === "B"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  B
                </button>
              </div>
              <button
                onClick={addPlayer}
                className="px-4 py-2 bg-green-600 active:bg-green-700 rounded-lg text-xs font-medium transition shrink-0"
              >
                Add
              </button>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-2 gap-3">
              {(["A", "B"] as const).map((team) => {
                const teamPlayers = team === "A" ? teamA : teamB;
                return (
                  <div
                    key={team}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-3"
                  >
                    <h2
                      className={team === "A" ? "text-sm font-bold mb-2 text-blue-400" : "text-sm font-bold mb-2 text-yellow-400"}
                    >
                      Team {team}
                      <span className="text-gray-500 text-xs font-normal ml-1">
                        ({teamPlayers.length})
                      </span>
                    </h2>
                    {teamPlayers.length === 0 ? (
                      <p className="text-gray-600 text-xs">No players</p>
                    ) : (
                      <div className="space-y-2">
                        {teamPlayers.map((p) => (
                          <div
                            key={p.id}
                            className="bg-gray-800 rounded-lg px-2 py-2"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-medium text-xs truncate mr-1">
                                {p.name}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => switchTeam(p.id)}
                                  className={
                                    team === "A"
                                      ? "px-1.5 py-0.5 text-[10px] rounded font-medium transition bg-yellow-600/20 text-yellow-400 active:bg-yellow-600/40"
                                      : "px-1.5 py-0.5 text-[10px] rounded font-medium transition bg-blue-600/20 text-blue-400 active:bg-blue-600/40"
                                  }
                                >
                                  →{team === "A" ? "B" : "A"}
                                </button>
                                <button
                                  onClick={() => removePlayer(p.id)}
                                  className="w-5 h-5 rounded bg-gray-700 active:bg-red-600/40 text-gray-400 active:text-red-400 flex items-center justify-center text-xs transition"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => updateBet(p.id, -50)}
                                className="w-7 h-7 rounded bg-gray-700 active:bg-gray-600 flex items-center justify-center transition text-xs"
                              >
                                −
                              </button>
                              <span className="w-14 text-center font-mono text-xs">
                                ₹{p.bet}
                              </span>
                              <button
                                onClick={() => updateBet(p.id, 50)}
                                className="w-7 h-7 rounded bg-gray-700 active:bg-gray-600 flex items-center justify-center transition text-xs"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Scenarios */}
            <div className="grid grid-cols-2 gap-3">
              {(["A", "B"] as const).map((team) => {
                const scenario = team === "A" ? scenarioA : scenarioB;
                return (
                  <div
                    key={team}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-3"
                  >
                    <h2
                      className={team === "A" ? "text-sm font-bold mb-0.5 text-blue-400" : "text-sm font-bold mb-0.5 text-yellow-400"}
                    >
                      {team} Wins
                    </h2>
                    <p className="text-gray-500 text-xs mb-2">
                      Pool: ₹{totalPool}
                    </p>
                    {!scenario ? (
                      <p className="text-gray-600 text-xs">
                        Both teams need players.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {scenario.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <span
                                className={
                                  p.team === "A"
                                    ? "w-1.5 h-1.5 rounded-full shrink-0 bg-blue-400"
                                    : "w-1.5 h-1.5 rounded-full shrink-0 bg-yellow-400"
                                }
                              />
                              <span className="truncate">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-1">
                              <span className="font-mono text-gray-400">
                                ₹{p.bet}
                              </span>
                              <span
                                className={`font-mono font-medium w-14 text-right ${
                                  p.profit >= 0 ? "text-green-400" : "text-red-400"
                                }`}
                              >
                                {p.profit >= 0 ? "+" : ""}
                                {p.profit.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-6">
          <h2 className="text-lg font-bold mb-2">Ready to start?</h2>
          <p className="text-gray-500 text-xs mb-4">Log in to place real bets and track your record.</p>
          <Link
            href="/login"
            className="inline-block px-8 py-2.5 bg-blue-600 active:bg-blue-700 rounded-lg text-sm font-medium transition"
          >
            Login
          </Link>
        </section>
      </div>
    </div>
  );
}
