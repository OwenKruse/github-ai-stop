import Link from "next/link"
import { StatCard } from "@/components/stat-card"
import { TrustScoreBadge } from "@/components/trust-score-badge"
import { ContributorAvatar } from "@/components/contributor-avatar"
import {
  GitPullRequest,
  ShieldAlert,
  Gauge,
  FolderGit2,
  ArrowRight,
} from "lucide-react"
import {
  getDashboardStats,
  getPRVolumeData,
  getSpamRateTrend,
  getTrustScoreDistribution,
  getActivityEvents,
} from "@/lib/db/queries"
import { DashboardCharts } from "./dashboard-charts"

export default async function DashboardPage() {
  const [stats, prVolume, spamTrend, trustDist, activity] = await Promise.all([
    getDashboardStats(),
    getPRVolumeData(),
    getSpamRateTrend(),
    getTrustScoreDistribution(),
    getActivityEvents(8),
  ])

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time protection metrics across your repositories
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="PRs This Week"
          value={String(stats.prsThisWeek)}
          icon={GitPullRequest}
          accent="green"
        />
        <StatCard
          title="Spam Blocked"
          value={String(stats.spamBlocked)}
          icon={ShieldAlert}
          accent="red"
        />
        <StatCard
          title="Avg Trust Score"
          value={String(stats.avgTrustScore)}
          icon={Gauge}
          accent="blue"
        />
        <StatCard
          title="Active Repos"
          value={String(stats.activeRepos)}
          icon={FolderGit2}
          accent="orange"
        />
      </div>

      {/* Charts (client component for recharts) */}
      <DashboardCharts
        prVolumeData={prVolume}
        spamRateTrend={spamTrend}
        trustScoreDistribution={trustDist}
        totalPRs={stats.prsThisWeek}
      />

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Latest PR events across your repos</p>
          </div>
          <Link
            href="/dashboard/activity"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="rounded-md border border-border bg-card">
          {activity.length > 0 ? (
            <div className="divide-y divide-border">
              {activity.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors"
                >
                  <ContributorAvatar
                    username={event.contributor.username}
                    avatarUrl={event.contributor.avatarUrl}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-foreground truncate">
                        {event.contributor.username}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">in</span>
                      <span className="text-xs text-muted-foreground font-mono truncate hidden sm:inline">
                        {event.repository.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      #{event.prNumber} {event.prTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ActionBadge action={event.action} />
                    <TrustScoreBadge score={event.trustScore} />
                    <span className="text-[11px] text-muted-foreground font-mono w-12 text-right hidden md:block">
                      {new Date(event.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No activity yet. Events will appear here once your GitHub App receives webhook events.
            </div>
          )}
        </div>
      </div>
    </div>
  )
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
