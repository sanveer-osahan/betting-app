import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";
import BetsClient from "./BetsClient";

export default async function BetsPage() {
  const session = await getSession();
  const admin = session ? isAdmin(session) : false;
  if (admin && !session?.currentProfileId) redirect("/profiles");
  return <BetsClient isAdmin={admin} />;
}
