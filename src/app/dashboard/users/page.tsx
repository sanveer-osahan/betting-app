"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  name: string;
}

type ModalMode = null | "create" | "edit";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setUsers(data);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      username: formData.get("username") as string,
      name: formData.get("name") as string,
      password: formData.get("password") as string,
    };

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to create user");
        return;
      }

      setModalMode(null);
      fetchUsers();
    } catch {
      setFormError("Something went wrong");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingUser) return;
    setFormError("");
    setFormLoading(true);

    const formData = new FormData(e.currentTarget);
    const body: { username: string; name: string; password?: string } = {
      username: formData.get("username") as string,
      name: formData.get("name") as string,
    };
    const password = formData.get("password") as string;
    if (password) body.password = password;

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to update user");
        return;
      }

      setModalMode(null);
      setEditingUser(null);
      fetchUsers();
    } catch {
      setFormError("Something went wrong");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingUser) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete user");
        return;
      }

      setDeletingUser(null);
      fetchUsers();
    } catch {
      setError("Something went wrong");
    } finally {
      setDeleteLoading(false);
    }
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setModalMode("edit");
    setFormError("");
  }

  function openCreate() {
    setEditingUser(null);
    setModalMode("create");
    setFormError("");
  }

  function closeModal() {
    setModalMode(null);
    setEditingUser(null);
    setFormError("");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          Create User
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950 border border-red-800 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-left text-sm text-gray-400">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-800 last:border-0"
                >
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3 text-gray-400">{user.username}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(user)}
                      className="px-3 py-1 text-sm text-blue-400 hover:bg-gray-800 rounded transition mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingUser(user)}
                      className="px-3 py-1 text-sm text-red-400 hover:bg-gray-800 rounded transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {modalMode === "create" ? "Create User" : "Edit User"}
            </h2>

            {formError && (
              <p className="text-red-400 text-sm bg-red-950 p-2 rounded mb-4">
                {formError}
              </p>
            )}

            <form
              onSubmit={
                modalMode === "create" ? handleCreateSubmit : handleEditSubmit
              }
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingUser?.name ?? ""}
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  name="username"
                  type="text"
                  required
                  defaultValue={editingUser?.username ?? ""}
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Password
                  {modalMode === "edit" && (
                    <span className="text-gray-500 font-normal">
                      {" "}
                      (leave blank to keep current)
                    </span>
                  )}
                </label>
                <input
                  name="password"
                  type="password"
                  minLength={6}
                  required={modalMode === "create"}
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {formLoading
                    ? "Saving..."
                    : modalMode === "create"
                      ? "Create"
                      : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
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
      {deletingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-2">Delete User</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <span className="text-white font-medium">
                {deletingUser.name}
              </span>{" "}
              ({deletingUser.username})? This action cannot be undone.
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
                onClick={() => setDeletingUser(null)}
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
