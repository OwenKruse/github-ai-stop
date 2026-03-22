import Link from "next/link"
import { GitFork } from "lucide-react"
import { getRepositories } from "@/lib/db/queries"
import { cn } from "@/lib/utils"
import { InstallOnRepoButton } from "./install-on-repo"

export const dynamic = "force-dynamic"

export default async function RepositoriesPage() {
  const repos = await getRepositories()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Repositories</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {repos.length} repositories with GitGuard protection
          </p>
        </div>
        <InstallOnRepoButton existingRepoNames={repos.map((r) => r.fullName)} />
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="grid grid-cols-[1fr_90px_80px_80px_80px_100px] gap-2 px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <span>Repository</span>
          <span>Status</span>
          <span>Threshold</span>
          <span className="text-right">PRs</span>
          <span className="text-right">Spam</span>
          <span className="text-right">Mode</span>
        </div>

        <div className="divide-y divide-border">
          {repos.map((repo) => {
            const statusConfig = {
              active: { dot: "bg-notion-green", label: "Active" },
              paused: { dot: "bg-notion-orange", label: "Paused" },
              error: { dot: "bg-notion-red", label: "Error" },
            }
            const s = statusConfig[repo.status]

            return (
              <Link
                key={repo.id}
                href={`/dashboard/repositories/${repo.id}`}
                className="grid grid-cols-[1fr_90px_80px_80px_80px_100px] gap-2 px-4 py-3 items-center hover:bg-accent/40 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded bg-notion-bg-gray flex items-center justify-center shrink-0">
                    <GitFork className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-notion-blue transition-colors">
                      {repo.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{repo.owner}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full shrink-0", s.dot)} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-notion-green transition-all"
                      style={{ width: `${repo.trustThreshold}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-6 text-right">{repo.trustThreshold}</span>
                </div>

                <span className="text-sm font-mono text-foreground text-right">{repo.prsThisMonth}</span>

                <span className={cn(
                  "text-sm font-mono text-right",
                  repo.spamRate > 15 ? "text-notion-red" : repo.spamRate > 10 ? "text-notion-orange" : "text-muted-foreground"
                )}>
                  {repo.spamRate.toFixed(1)}%
                </span>

                <div className="flex items-center justify-end gap-1.5">
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    repo.autoClose
                      ? "bg-notion-bg-red text-notion-red"
                      : "bg-notion-bg-gray text-muted-foreground"
                  )}>
                    {repo.autoClose ? "Auto-close" : "Flag only"}
                  </span>
                </div>
              </Link>
            )
          })}

          {repos.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
              <GitFork className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No repositories yet</p>
              <p className="text-xs text-center max-w-xs">
                Click &ldquo;Install on Repo&rdquo; above to connect your GitHub repositories to GitGuard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
