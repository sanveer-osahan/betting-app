"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TeamInfo {
  id: string;
  fullName: string;
  shortName: string;
  teamColor: string;
}

interface Schedule {
  id: string;
  team1: TeamInfo;
  team2: TeamInfo;
  startsAt: string;
  isSystemGenerated: boolean;
}

function formatIST(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SchedulesPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(
    null
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchSchedules() {
    try {
      const res = await fetch("/api/schedules");
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setSchedules(data);
    } catch {
      setError("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeams() {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch {
      // teams fetch is secondary, don't block
    }
  }

  useEffect(() => {
    fetchSchedules();
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    const formData = new FormData(e.currentTarget);
    const team1Id = formData.get("team1Id") as string;
    const team2Id = formData.get("team2Id") as string;
    const dateTimeLocal = formData.get("startsAt") as string;

    if (!team1Id || !team2Id || !dateTimeLocal) {
      setFormError("All fields are required");
      setFormLoading(false);
      return;
    }

    if (team1Id === team2Id) {
      setFormError("Team 1 and Team 2 must be different");
      setFormLoading(false);
      return;
    }

    // Append IST offset to datetime-local value
    const startsAt = dateTimeLocal + ":00+05:30";

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team1Id, team2Id, startsAt }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to create schedule");
        return;
      }

      setShowCreate(false);
      fetchSchedules();
    } catch {
      setFormError("Something went wrong");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingSchedule) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/schedules/${deletingSchedule.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete schedule");
        return;
      }

      setDeletingSchedule(null);
      fetchSchedules();
    } catch {
      setError("Something went wrong");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading schedules...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Schedules</h1>
        <button
          onClick={() => {
            setShowCreate(true);
            setFormError("");
          }}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          Create Schedule
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950 border border-red-800 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Schedule Cards */}
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-500">
            No schedules found
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">
                  <span style={{ color: schedule.team1.teamColor }}>
                    {schedule.team1.fullName}
                  </span>
                  <span className="text-gray-500 mx-2">vs</span>
                  <span style={{ color: schedule.team2.teamColor }}>
                    {schedule.team2.fullName}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {formatIST(schedule.startsAt)}
                </p>
              </div>
              <div>
                {schedule.isSystemGenerated ? (
                  <span className="px-3 py-1 text-sm text-gray-600">—</span>
                ) : (
                  <button
                    onClick={() => setDeletingSchedule(schedule)}
                    className="px-3 py-1 text-sm text-red-400 hover:bg-gray-800 rounded transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Create Schedule</h2>

            {formError && (
              <p className="text-red-400 text-sm bg-red-950 p-2 rounded mb-4">
                {formError}
              </p>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Team 1
                </label>
                <select
                  name="team1Id"
                  required
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Team 1
                  </option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Team 2
                </label>
                <select
                  name="team2Id"
                  required
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Team 2
                  </option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Starts At (IST)
                </label>
                <input
                  name="startsAt"
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {formLoading ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSchedule && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-2">Delete Schedule</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <span
                style={{ color: deletingSchedule.team1.teamColor }}
                className="font-medium"
              >
                {deletingSchedule.team1.fullName}
              </span>
              <span className="text-gray-500"> vs </span>
              <span
                style={{ color: deletingSchedule.team2.teamColor }}
                className="font-medium"
              >
                {deletingSchedule.team2.fullName}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeletingSchedule(null)}
                className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
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
