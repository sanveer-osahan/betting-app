import { cookies } from "next/headers";

export interface Session {
  id: string;
  username: string;
  name: string;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  if (!session) return null;

  try {
    return JSON.parse(session.value) as Session;
  } catch {
    return null;
  }
}

export function isAdmin(session: Session | null): boolean {
  return session?.username === "admin";
}
