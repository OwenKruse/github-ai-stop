import { ExternalLink } from "lucide-react"
import { ContributorAvatar } from "@/components/contributor-avatar"
import { TrustScoreBadge } from "@/components/trust-score-badge"

interface PREvent {
  id: string
  timestamp: string
  contributor: { username: string; avatarUrl: string }
  prTitle: string
  prNumber: number
  action: string
  trustScore: number
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    labeled_trusted: "bg-notion-bg-green text-notion-green",
    flagged: "bg-notion-bg-orange text-notion-orange",
    auto_closed: "bg-notion-bg-red text-notion-red",
    whitelisted: "bg-notion-bg-blue text-notion-blue",
  }
  const labels: Record<string, string> = {
    labeled_trusted: "Trusted",
    flagged: "Flagged",
    auto_closed: "Closed",
    whitelisted: "Whitelisted",
  }
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${styles[action] ?? ""}`}>
      {labels[action] ?? action}
    </span>
  )
}

export function RepoPRList({ events, repoFullName }: { events: PREvent[]; repoFullName: string }) {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground mb-0.5">Recent Pull Requests</h2>
        <p className="text-xs text-muted-foreground">Latest PR activity for this repository</p>
      </div>
      <div className="rounded-md border border-border bg-card">
        {events.length > 0 ? (
          <div className="divide-y divide-border">
            {events.map((event) => (
              <a
                key={event.id}
                href={`https://github.com/${repoFullName}/pull/${event.prNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors group"
              >
                <ContributorAvatar
                  username={event.contributor.username}
                  avatarUrl={event.contributor.avatarUrl}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-foreground truncate group-hover:text-notion-blue transition-colors">{event.prTitle}</p>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">#{event.prNumber}</p>
                </div>
                <ActionBadge action={event.action} />
                <TrustScoreBadge score={event.trustScore} />
                <span className="text-[11px] text-muted-foreground font-mono w-16 text-right hidden sm:block">
                  {new Date(event.timestamp).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No recent PRs for this repository
          </div>
        )}
      </div>
    </div>
  )
}
