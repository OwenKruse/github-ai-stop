"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ContributorAvatar } from "@/components/contributor-avatar"
import { TrustScoreBadge } from "@/components/trust-score-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download } from "lucide-react"

interface ActivityEventRow {
  id: string
  timestamp: string
  contributor: { username: string; avatarUrl: string }
  repository: { name: string; owner: string }
  prTitle: string
  prNumber: number
  action: string
  trustScore: number
}

interface RepoOption {
  id: string
  fullName: string
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
    auto_closed: "Auto-Closed",
    whitelisted: "Whitelisted",
  }
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${styles[action] ?? ""}`}>
      {labels[action] ?? action}
    </span>
  )
}

function getActionDescription(action: string) {
  switch (action) {
    case "labeled_trusted":
      return "was labeled as a trusted contributor"
    case "flagged":
      return "was flagged for review due to low trust score"
    case "auto_closed":
      return "was automatically closed due to very low trust score"
    case "whitelisted":
      return "was added to the whitelist"
    default:
      return ""
  }
}

export function ActivityFeed({
  activity,
  repoOptions,
}: {
  activity: ActivityEventRow[]
  repoOptions: RepoOption[]
}) {
  const [filterRepo, setFilterRepo] = useState<string>("all")
  const [filterAction, setFilterAction] = useState<string>("all")

  const filtered = activity.filter((event) => {
    if (filterRepo !== "all" && `${event.repository.owner}/${event.repository.name}` !== filterRepo) {
      return false
    }
    if (filterAction !== "all" && event.action !== filterAction) {
      return false
    }
    return true
  })

  const trusted = activity.filter((e) => e.action === "labeled_trusted").length
  const flagged = activity.filter((e) => e.action === "flagged").length
  const autoClosed = activity.filter((e) => e.action === "auto_closed").length
  const whitelisted = activity.filter((e) => e.action === "whitelisted").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Activity Feed</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Chronological log of all PR events and actions across your repositories
        </p>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-notion-green" />
          <span className="text-muted-foreground">Trusted</span>
          <span className="font-semibold text-foreground">{trusted}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-notion-orange" />
          <span className="text-muted-foreground">Flagged</span>
          <span className="font-semibold text-foreground">{flagged}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-notion-red" />
          <span className="text-muted-foreground">Auto-Closed</span>
          <span className="font-semibold text-foreground">{autoClosed}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-notion-blue" />
          <span className="text-muted-foreground">Whitelisted</span>
          <span className="font-semibold text-foreground">{whitelisted}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterRepo} onValueChange={setFilterRepo}>
          <SelectTrigger className="w-[200px] h-8 text-sm rounded-md">
            <SelectValue placeholder="All repositories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All repositories</SelectItem>
            {repoOptions.map((repo) => (
              <SelectItem key={repo.id} value={repo.fullName}>
                {repo.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[180px] h-8 text-sm rounded-md">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="labeled_trusted">Labeled Trusted</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="auto_closed">Auto-Closed</SelectItem>
            <SelectItem value="whitelisted">Whitelisted</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs rounded-md">
          <Calendar className="h-3 w-3" />
          Date Range
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs rounded-md">
          <Download className="h-3 w-3" />
          Export
        </Button>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {activity.length} events
        </span>
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="divide-y divide-border">
          {filtered.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 px-4 py-3 hover:bg-accent/40 transition-colors"
            >
              <ContributorAvatar
                username={event.contributor.username}
                avatarUrl={event.contributor.avatarUrl}
                size="sm"
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{event.contributor.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {getActionDescription(event.action)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-mono">
                    {event.repository.owner}/{event.repository.name}
                  </span>
                  <span>&middot;</span>
                  <span>
                    #{event.prNumber} {event.prTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <ActionBadge action={event.action} />
                  <TrustScoreBadge score={event.trustScore} />
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                {new Date(event.timestamp).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {activity.length === 0
              ? "No activity yet. Events will appear here once your GitHub App receives webhook events."
              : "No events match your current filters"}
          </div>
        )}
      </div>
    </div>
  )
}
