import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";
import ProfilesClient from "./ProfilesClient";

export default async function ProfilesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdmin(session)) redirect("/");

  return (
    <ProfilesClient
      currentProfileId={session.currentProfileId}
    />
  );
}
