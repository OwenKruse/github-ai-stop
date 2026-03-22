import { getContributorsWithRepoCount } from "@/lib/db/queries"
import { ContributorsTable } from "./contributors-table"

export const dynamic = "force-dynamic"

export default async function ContributorsPage() {
  const contributors = await getContributorsWithRepoCount()

  return <ContributorsTable contributors={contributors} />
}
