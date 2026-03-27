import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";
import PlayersClient from "./PlayersClient";

export default async function PlayersPage() {
  const session = await getSession();
  const admin = session ? isAdmin(session) : false;
  if (admin && !session?.currentProfileId) redirect("/profiles");
  return <PlayersClient isAdmin={admin} />;
}
