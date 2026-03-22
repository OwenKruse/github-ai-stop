import { getActivityEvents, getRepositories } from "@/lib/db/queries"
import { ActivityFeed } from "./activity-feed"

export const dynamic = "force-dynamic"

export default async function ActivityPage() {
  const [activity, repos] = await Promise.all([
    getActivityEvents(100),
    getRepositories(),
  ])

  const repoOptions = repos.map((r) => ({
    id: r.id,
    fullName: r.fullName,
  }))

  return <ActivityFeed activity={activity} repoOptions={repoOptions} />
}
