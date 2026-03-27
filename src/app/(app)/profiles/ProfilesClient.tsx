"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  name: string;
  _count: { users: number };
}

interface ProfileUser {
  id: string;
  username: string;
  name: string;
}

export default function ProfilesClient({
  currentProfileId,
}: {
  currentProfileId: string | null;
}) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New profile form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit profile name
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  // Users per profile
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [profileUsers, setProfileUsers] = useState<Record<string, ProfileUser[]>>({});
  const [loadingUsers, setLoadingUsers] = useState<Record<string, boolean>>({});

  // Add user form
  const [addUserProfileId, setAddUserProfileId] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [userError, setUserError] = useState("");

  // Switch
  const [switching, setSwitching] = useState<string | null>(null);

  const fetchProfiles = useCallback(() => {
    fetch("/api/profiles")
      .then((res) => res.json())
      .then((data) => setProfiles(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProfileName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create profile");
        return;
      }
      setNewProfileName("");
      setShowNewForm(false);
      fetchProfiles();
    } catch {
      setError("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveEdit(profileId: string) {
    if (!editName.trim()) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/profiles/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to rename profile");
        return;
      }
      setEditingId(null);
      fetchProfiles();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleSwitch(profileId: string) {
    setSwitching(profileId);
    try {
      const res = await fetch(`/api/profiles/${profileId}/switch`, { method: "POST" });
      if (!res.ok) return;
      router.push("/");
      router.refresh();
    } catch {
      // ignore
    } finally {
      setSwitching(null);
    }
  }

  async function loadUsers(profileId: string) {
    setLoadingUsers((prev) => ({ ...prev, [profileId]: true }));
    try {
      const res = await fetch(`/api/profiles/${profileId}/users`);
      const data = await res.json();
      setProfileUsers((prev) => ({ ...prev, [profileId]: Array.isArray(data) ? data : [] }));
    } catch {
      // ignore
    } finally {
      setLoadingUsers((prev) => ({ ...prev, [profileId]: false }));
    }
  }

  function toggleUsers(profileId: string) {
    const expanded = !expandedUsers[profileId];
    setExpandedUsers((prev) => ({ ...prev, [profileId]: expanded }));
    if (expanded && !profileUsers[profileId]) {
      loadUsers(profileId);
    }
  }

  async function handleAddUser(e: React.FormEvent, profileId: string) {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim() || !newPassword) return;
    setAddingUser(true);
    setUserError("");

    try {
      const res = await fetch(`/api/profiles/${profileId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          name: newName.trim(),
          password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUserError(data.error || "Failed to add user");
        return;
      }
      setNewUsername("");
      setNewName("");
      setNewPassword("");
      setAddUserProfileId(null);
      loadUsers(profileId);
      fetchProfiles();
    } catch {
      setUserError("Something went wrong");
    } finally {
      setAddingUser(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Profiles</h1>
        <button
          onClick={() => {
            setShowNewForm(!showNewForm);
            setNewProfileName("");
          }}
          className="px-3 py-1.5 bg-blue-600 rounded-lg text-sm font-medium active:bg-blue-700 transition"
        >
          New Profile
        </button>
      </div>

      {/* New Profile Form */}
      {showNewForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-sm font-semibold mb-3">Create Profile</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Profile name"
              autoFocus
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-gray-500"
            />
            <button
              type="submit"
              disabled={creating || !newProfileName.trim()}
              className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium active:bg-blue-700 transition disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-3 py-2 bg-gray-800 rounded-lg text-sm active:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="rounded-lg p-3 border bg-red-900/30 border-red-800 text-red-400 text-xs text-center mb-4">
          {error}
        </div>
      )}

      {profiles.length === 0 ? (
        <p className="text-gray-500 text-sm">No profiles yet. Create one to get started.</p>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => {
            const isActive = profile.id === currentProfileId;
            const isEditing = editingId === profile.id;
            const usersExpanded = expandedUsers[profile.id];
            const users = profileUsers[profile.id] ?? [];
            const isLoadingUsers = loadingUsers[profile.id];
            const showAddUser = addUserProfileId === profile.id;

            return (
              <div
                key={profile.id}
                className={`bg-gray-900 border rounded-lg p-4 ${
                  isActive ? "border-blue-700" : "border-gray-800"
                }`}
              >
                {/* Profile header */}
                <div className="flex items-center gap-2 mb-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-gray-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(profile.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveEdit(profile.id)}
                        disabled={saving || !editName.trim()}
                        className="px-2 py-1 bg-green-600 rounded text-xs font-medium disabled:opacity-50"
                      >
                        {saving ? "..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 bg-gray-700 rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-medium text-sm">{profile.name}</span>
                      {isActive && (
                        <span className="text-[10px] text-blue-400 border border-blue-800 rounded px-1.5 py-0.5">
                          Active
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setEditingId(profile.id);
                          setEditName(profile.name);
                        }}
                        className="text-gray-500 hover:text-gray-300 transition ml-1"
                        title="Rename"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {!isActive && !isEditing && (
                    <button
                      onClick={() => handleSwitch(profile.id)}
                      disabled={switching === profile.id}
                      className="px-3 py-1 bg-gray-800 rounded text-xs hover:bg-gray-700 transition disabled:opacity-50 shrink-0"
                    >
                      {switching === profile.id ? "Switching..." : "Switch"}
                    </button>
                  )}
                </div>

                {/* Users section */}
                <button
                  onClick={() => toggleUsers(profile.id)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition"
                >
                  <svg
                    className={`w-3 h-3 transition-transform ${usersExpanded ? "rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Users ({profile._count.users})
                </button>

                {usersExpanded && (
                  <div className="mt-3 space-y-2">
                    {isLoadingUsers ? (
                      <p className="text-xs text-gray-500">Loading...</p>
                    ) : users.length === 0 ? (
                      <p className="text-xs text-gray-600">No users yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {users.map((u) => (
                          <div key={u.id} className="flex items-center justify-between text-xs bg-gray-800 rounded px-3 py-2">
                            <span className="font-medium">{u.name}</span>
                            <span className="text-gray-500">@{u.username}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add User */}
                    {!showAddUser ? (
                      <button
                        onClick={() => {
                          setAddUserProfileId(profile.id);
                          setNewUsername("");
                          setNewName("");
                          setNewPassword("");
                          setUserError("");
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition"
                      >
                        + Add User
                      </button>
                    ) : (
                      <form
                        onSubmit={(e) => handleAddUser(e, profile.id)}
                        className="bg-gray-800 rounded-lg p-3 space-y-2 mt-2"
                      >
                        <p className="text-xs font-semibold text-gray-300">Add User</p>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="Full name"
                          className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs focus:outline-none focus:border-gray-500"
                        />
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="Username"
                          className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs focus:outline-none focus:border-gray-500"
                        />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Password (min 6 chars)"
                          className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs focus:outline-none focus:border-gray-500"
                        />
                        {userError && (
                          <p className="text-[10px] text-red-400">{userError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={addingUser || !newUsername.trim() || !newName.trim() || !newPassword}
                            className="flex-1 py-1.5 bg-blue-600 rounded text-xs font-medium disabled:opacity-50"
                          >
                            {addingUser ? "Adding..." : "Add User"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddUserProfileId(null)}
                            className="px-3 py-1.5 bg-gray-700 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
