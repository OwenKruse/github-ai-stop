"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ContributorAvatar } from "@/components/contributor-avatar"
import { TrustScoreBadge } from "@/components/trust-score-badge"
import { Search, ArrowUpDown, CheckCircle2, XCircle, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContributorRow {
  id: string
  username: string
  avatarUrl: string
  trustScore: number
  totalPRs: number
  mergedPRs: number
  mergeRate: number
  reposActiveIn: number
  lastActiveAt: string | null
  isWhitelisted: boolean
  isBlocked: boolean
}

type SortKey = "trustScore" | "totalPRs" | "mergeRate" | "reposActiveIn" | "lastActiveAt" | "username"

export function ContributorsTable({ contributors }: { contributors: ContributorRow[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("trustScore")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("desc")
    }
  }

  const filtered = contributors
    .filter((c) => c.username.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return 0
    })

  const highTrust = contributors.filter((c) => c.trustScore >= 80).length
  const medTrust = contributors.filter((c) => c.trustScore >= 40 && c.trustScore < 80).length
  const lowTrust = contributors.filter((c) => c.trustScore < 40).length

  const SortButton = ({ column, children }: { column: SortKey; children: React.ReactNode }) => (
    <button
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
      onClick={() => handleSort(column)}
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Contributors</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and manage contributor trust scores across all repositories
        </p>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-notion-green" />
          <span className="text-muted-foreground">High trust</span>
          <span className="font-semibold text-foreground">{highTrust}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-notion-orange" />
          <span className="text-muted-foreground">Medium</span>
          <span className="font-semibold text-foreground">{medTrust}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-notion-red" />
          <span className="text-muted-foreground">Low trust</span>
          <span className="font-semibold text-foreground">{lowTrust}</span>
        </div>
      </div>

      <div className="relative w-full max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search contributors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-sm rounded-md"
        />
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="grid grid-cols-[1fr_70px_80px_80px_60px_90px_100px_60px] gap-2 px-4 py-2 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contributor</span>
          <SortButton column="trustScore">Score</SortButton>
          <SortButton column="totalPRs">PRs</SortButton>
          <SortButton column="mergeRate">Merge %</SortButton>
          <SortButton column="reposActiveIn">Repos</SortButton>
          <SortButton column="lastActiveAt">Active</SortButton>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
          <span />
        </div>

        <div className="divide-y divide-border">
          {filtered.map((contributor) => (
            <div
              key={contributor.id}
              className="grid grid-cols-[1fr_70px_80px_80px_60px_90px_100px_60px] gap-2 px-4 py-2.5 items-center hover:bg-accent/40 transition-colors"
            >
              <ContributorAvatar
                username={contributor.username}
                avatarUrl={contributor.avatarUrl}
                showUsername
                size="sm"
              />
              <TrustScoreBadge score={contributor.trustScore} />
              <div className="text-sm font-mono text-foreground">
                {contributor.totalPRs}
                <span className="text-xs text-muted-foreground ml-1">
                  ({contributor.mergedPRs})
                </span>
              </div>
              <span
                className={cn(
                  "text-sm font-mono",
                  contributor.mergeRate > 70 ? "text-notion-green font-medium" : "text-muted-foreground"
                )}
              >
                {contributor.mergeRate.toFixed(1)}%
              </span>
              <span className="text-sm font-mono text-muted-foreground">
                {contributor.reposActiveIn}
              </span>
              <span className="text-xs text-muted-foreground">
                {contributor.lastActiveAt
                  ? new Date(contributor.lastActiveAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </span>
              <div className="flex items-center gap-1">
                {contributor.isWhitelisted && (
                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs bg-notion-bg-blue text-notion-blue">
                    <CheckCircle2 className="h-3 w-3" />
                    Whitelisted
                  </span>
                )}
                {contributor.isBlocked && (
                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs bg-notion-bg-red text-notion-red">
                    <XCircle className="h-3 w-3" />
                    Blocked
                  </span>
                )}
              </div>
              <div className="flex justify-end">
                <a
                  href={`https://github.com/${contributor.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {searchQuery
              ? `No contributors found matching "${searchQuery}"`
              : "No contributors tracked yet. Events will appear once your GitHub App receives webhook events."}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} contributors tracked across your repositories
      </p>
    </div>
  )
}
