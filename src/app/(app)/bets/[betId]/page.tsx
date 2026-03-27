import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";
import BetDetailClient from "./BetDetailClient";

export default async function BetDetailPage() {
  const session = await getSession();
  const admin = session ? isAdmin(session) : false;
  if (admin && !session?.currentProfileId) redirect("/profiles");
  return <BetDetailClient isAdmin={admin} />;
}
