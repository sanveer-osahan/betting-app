"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Team {
  id: string;
  fullName: string;
  shortName: string;
  teamColor: string;
  isSystemGenerated: boolean;
}

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchTeams() {
    try {
      const res = await fetch("/api/teams");
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setTeams(data);
    } catch {
      setError("Failed to load teams");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      fullName: formData.get("fullName") as string,
      shortName: formData.get("shortName") as string,
      teamColor: formData.get("teamColor") as string,
    };

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to create team");
        return;
      }

      setShowCreate(false);
      fetchTeams();
    } catch {
      setFormError("Something went wrong");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingTeam) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/teams/${deletingTeam.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete team");
        return;
      }

      setDeletingTeam(null);
      fetchTeams();
    } catch {
      setError("Something went wrong");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Teams</h1>
        <button
          onClick={() => {
            setShowCreate(true);
            setFormError("");
          }}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          Create Team
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950 border border-red-800 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Teams Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-left text-sm text-gray-400">
              <th className="px-4 py-3 font-medium">Team Name</th>
              <th className="px-4 py-3 font-medium">Short Name</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  No teams found
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr
                  key={team.id}
                  className="border-b border-gray-800 last:border-0"
                >
                  <td className="px-4 py-3">
                    <span style={{ color: team.teamColor }} className="font-medium">
                      {team.fullName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: team.teamColor }} className="font-medium">
                      {team.shortName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {team.isSystemGenerated ? (
                      <span className="px-3 py-1 text-sm text-gray-600">
                        —
                      </span>
                    ) : (
                      <button
                        onClick={() => setDeletingTeam(team)}
                        className="px-3 py-1 text-sm text-red-400 hover:bg-gray-800 rounded transition"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Create Team</h2>

            {formError && (
              <p className="text-red-400 text-sm bg-red-950 p-2 rounded mb-4">
                {formError}
              </p>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Chennai Super Kings"
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Short Name
                </label>
                <input
                  name="shortName"
                  type="text"
                  required
                  placeholder="e.g. CSK"
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Team Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    name="teamColor"
                    type="color"
                    required
                    defaultValue="#3B82F6"
                    className="w-12 h-10 bg-gray-800 rounded border border-gray-700 cursor-pointer"
                  />
                  <span className="text-sm text-gray-400">
                    Pick a color for the team
                  </span>
                </div>
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
      {deletingTeam && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-2">Delete Team</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <span style={{ color: deletingTeam.teamColor }} className="font-medium">
                {deletingTeam.fullName}
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
                onClick={() => setDeletingTeam(null)}
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
