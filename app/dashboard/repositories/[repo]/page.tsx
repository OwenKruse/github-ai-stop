import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, GitFork } from "lucide-react"
import { getRepositoryById, getActivityForRepo, getWhitelistedContributors } from "@/lib/db/queries"
import { RepoSettings } from "./repo-settings"
import { RepoWhitelist } from "./repo-whitelist"
import { RepoPRList } from "./repo-pr-list"

export const dynamic = "force-dynamic"

export default async function RepositoryDetailPage({ params }: { params: Promise<{ repo: string }> }) {
  const { repo: repoId } = await params
  const id = parseInt(repoId, 10)
  if (isNaN(id)) notFound()

  const repository = await getRepositoryById(id)
  if (!repository) notFound()

  const [recentPRs, whitelisted] = await Promise.all([
    getActivityForRepo(id, 10),
    getWhitelistedContributors(),
  ])

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link
          href="/dashboard/repositories"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Repositories
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-notion-bg-gray flex items-center justify-center">
            <GitFork className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{repository.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">{repository.fullName}</p>
          </div>
        </div>
      </div>

      <RepoSettings
        repoId={repository.id}
        trustThreshold={repository.trustThreshold}
        autoClose={repository.autoClose}
        autoLabel={repository.autoLabel}
      />

      <RepoWhitelist contributors={whitelisted} />

      <RepoPRList events={recentPRs} />
    </div>
  )
}
