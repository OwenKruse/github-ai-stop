"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ContributorAvatar } from "@/components/contributor-avatar"
import { TrustScoreBadge } from "@/components/trust-score-badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, X, Search, Loader2 } from "lucide-react"

interface Contributor {
  id: string
  username: string
  avatarUrl: string
  trustScore: number
  mergeRate: number
}

export function RepoWhitelist({ contributors: initial }: { contributors: Contributor[] }) {
  const router = useRouter()
  const [contributors, setContributors] = useState(initial)
  const [removing, setRemoving] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    setContributors(initial)
  }, [initial])

  async function handleRemove(id: string) {
    setRemoving(id)
    setContributors((prev) => prev.filter((c) => c.id !== id))
    try {
      await fetch(`/api/contributors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isWhitelisted: false }),
      })
      router.refresh()
    } finally {
      setRemoving(null)
    }
  }

  function handleAdded() {
    setDialogOpen(false)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-0.5">Whitelisted Contributors</h2>
          <p className="text-xs text-muted-foreground">Bypass trust score checks</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-md text-xs">
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add to Whitelist</DialogTitle>
              <DialogDescription>
                Search for a contributor to whitelist. Their trust score will be set to 100.
              </DialogDescription>
            </DialogHeader>
            <ContributorSearch onAdd={handleAdded} />
          </DialogContent>
        </Dialog>
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  disabled={removing === c.id}
                  onClick={() => handleRemove(c.id)}
                >
                  {removing === c.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
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

function ContributorSearch({ onAdd }: { onAdd: () => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/contributors/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        setResults(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInputChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 250)
  }

  async function handleWhitelist(id: string) {
    setAdding(id)
    try {
      await fetch(`/api/contributors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isWhitelisted: true }),
      })
      onAdd()
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by username..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          className="pl-8 h-8 text-sm rounded-md"
          autoFocus
        />
      </div>

      <div className="max-h-64 overflow-y-auto rounded-md border border-border">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : results.length > 0 ? (
          <div className="divide-y divide-border">
            {results.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-accent/40 transition-colors"
              >
                <ContributorAvatar username={c.username} avatarUrl={c.avatarUrl} showUsername size="sm" />
                <div className="flex-1" />
                <TrustScoreBadge score={c.trustScore} />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs px-2"
                  disabled={adding === c.id}
                  onClick={() => handleWhitelist(c.id)}
                >
                  {adding === c.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Whitelist"
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : query.length > 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No matching contributors found
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Type a username to search
          </div>
        )}
      </div>
    </div>
  )
}
