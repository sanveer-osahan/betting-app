"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TeamInfo {
  id: string;
  fullName: string;
  shortName: string;
  teamColor: string;
}

interface BetInfo {
  id: string;
  teamId: string;
  amount: number;
  userId: string;
  user: { id: string; name: string; username: string };
}

interface Schedule {
  id: string;
  team1: TeamInfo;
  team2: TeamInfo;
  startsAt: string;
  bets: BetInfo[];
}

function formatIST(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function categorizeSchedule(startsAt: string): "current" | "upcoming" | "past" {
  const now = new Date();
  const start = new Date(startsAt);
  const diffMs = start.getTime() - now.getTime();
  const hourMs = 60 * 60 * 1000;

  if (diffMs > 0 && diffMs <= 24 * hourMs) {
    // Less than 24h before start
    return "current";
  }
  if (diffMs > 24 * hourMs) {
    return "upcoming";
  }
  // Match has started
  if (Math.abs(diffMs) < 4 * hourMs) {
    // Within 4h after start
    return "current";
  }
  return "past";
}

function isBettingOpen(startsAt: string): boolean {
  const now = new Date();
  const start = new Date(startsAt);
  return now.getTime() <= start.getTime();
}

export default function BetsPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    current: true,
    upcoming: true,
    past: false,
  });
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    // Get current user ID from session cookie
    try {
      const sessionCookie = document.cookie
        .split("; ")
        .find((c) => c.startsWith("session="));
      if (sessionCookie) {
        const session = JSON.parse(decodeURIComponent(sessionCookie.split("=").slice(1).join("=")));
        setCurrentUserId(session.id);
      }
    } catch {
      // ignore
    }

    fetch("/api/schedules")
      .then((res) => res.json())
      .then((data) => setSchedules(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const current = schedules.filter((s) => categorizeSchedule(s.startsAt) === "current");
  const upcoming = schedules.filter((s) => categorizeSchedule(s.startsAt) === "upcoming");
  const past = schedules.filter((s) => categorizeSchedule(s.startsAt) === "past");

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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Bets</h1>

      <div className="space-y-4">
        <CollapsibleSection
          title="Current Bets"
          count={current.length}
          expanded={expandedSections.current}
          onToggle={() => toggleSection("current")}
        >
          <ScheduleList schedules={current} currentUserId={currentUserId} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Upcoming Bets"
          count={upcoming.length}
          expanded={expandedSections.upcoming}
          onToggle={() => toggleSection("upcoming")}
        >
          <ScheduleList schedules={upcoming} currentUserId={currentUserId} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Past Bets"
          count={past.length}
          expanded={expandedSections.past}
          onToggle={() => toggleSection("past")}
        >
          <ScheduleList schedules={past} currentUserId={currentUserId} />
        </CollapsibleSection>
      </div>
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

function ScheduleList({
  schedules,
  currentUserId,
}: {
  schedules: Schedule[];
  currentUserId: string;
}) {
  if (schedules.length === 0) {
    return <p className="text-gray-600 text-sm py-2">No matches found</p>;
  }

  return (
    <div className="space-y-3">
      {schedules.map((schedule) => {
        const userBet = schedule.bets.find((b) => b.userId === currentUserId);
        const bettingOpen = isBettingOpen(schedule.startsAt);
        const bettingTeam = userBet
          ? schedule.team1.id === userBet.teamId
            ? schedule.team1
            : schedule.team2
          : null;

        return (
          <Link
            key={schedule.id}
            href={`/dashboard/bets/${schedule.id}`}
            className="block bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">
                <span style={{ color: schedule.team1.teamColor }}>
                  {schedule.team1.shortName}
                </span>
                <span className="text-gray-500 mx-2">vs</span>
                <span style={{ color: schedule.team2.teamColor }}>
                  {schedule.team2.shortName}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatIST(schedule.startsAt)}
              </span>
            </div>

            {userBet && bettingTeam ? (
              <p className="text-xs text-gray-400">
                You placed{" "}
                <span className="text-white font-medium">₹{userBet.amount}</span>{" "}
                on{" "}
                <span style={{ color: bettingTeam.teamColor }} className="font-medium">
                  {bettingTeam.shortName}
                </span>
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                {bettingOpen ? "No bet placed yet" : "Betting closed"}
              </p>
            )}

            {!bettingOpen && (
              <span className="inline-block mt-1 text-[10px] text-red-400 bg-red-900/30 px-2 py-0.5 rounded">
                Betting Closed
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
