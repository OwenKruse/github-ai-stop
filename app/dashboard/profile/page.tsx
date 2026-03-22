import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users, accounts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getActivityEvents } from "@/lib/db/queries"
import { ProfileClient } from "./profile-client"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))

  if (!user) redirect("/login")

  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, session.user.id))

  const recentActivity = await getActivityEvents(5)

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name ?? "",
        email: user.email ?? "",
        image: user.image ?? "",
      }}
      githubUsername={account?.providerAccountId ?? ""}
      provider={account?.provider ?? "github"}
      activityCount={recentActivity.length}
    />
  )
}
