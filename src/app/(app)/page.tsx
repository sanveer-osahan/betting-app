import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";
import LeaderboardClient from "./LeaderboardClient";

export default async function LeaderboardPage() {
  const session = await getSession();
  const admin = session ? isAdmin(session) : false;
  if (admin && !session?.currentProfileId) redirect("/profiles");

  const hasProfile = !!session?.currentProfileId;
  return <LeaderboardClient isAdmin={admin} hasProfile={hasProfile} />;
}
