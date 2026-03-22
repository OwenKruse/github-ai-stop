import { Button } from "@/components/ui/button"
import { ContributorAvatar } from "@/components/contributor-avatar"
import { TrustScoreBadge } from "@/components/trust-score-badge"
import { Plus, X } from "lucide-react"

interface Contributor {
  id: string
  username: string
  avatarUrl: string
  trustScore: number
  mergeRate: number
}

export function RepoWhitelist({ contributors }: { contributors: Contributor[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-0.5">Whitelisted Contributors</h2>
          <p className="text-xs text-muted-foreground">Bypass trust score checks</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-md text-xs">
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>
      <div className="rounded-md border border-border bg-card">
        {contributors.length > 0 ? (
          <div className="divide-y divide-border">
            {contributors.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors">
                <ContributorAvatar username={c.username} avatarUrl={c.avatarUrl} showUsername size="sm" />
                <div className="flex-1" />
                <TrustScoreBadge score={c.trustScore} />
                <span className="text-xs text-muted-foreground font-mono w-14 text-right">{c.mergeRate}%</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No whitelisted contributors yet
          </div>
        )}
      </div>
    </div>
  )
}
