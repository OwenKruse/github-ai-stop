import { getContributorsWithRepoCount } from "@/lib/db/queries"
import { ContributorsTable } from "./contributors-table"

export default async function ContributorsPage() {
  const contributors = await getContributorsWithRepoCount()

  return <ContributorsTable contributors={contributors} />
}
