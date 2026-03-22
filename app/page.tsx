import { getPlatformStats } from "@/lib/db/queries"
import LandingPage from "./landing-page"

export const revalidate = 300

export default async function Page() {
  const stats = await getPlatformStats()
  return <LandingPage stats={stats} />
}
