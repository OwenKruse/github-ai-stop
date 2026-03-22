"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import {
  Plus,
  Github,
  GitFork,
  Loader2,
  Check,
  ExternalLink,
  Lock,
  Search,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface Installation {
  installationId: number
  account: { login: string; avatarUrl: string }
  repos: {
    githubId: number
    name: string
    fullName: string
    owner: string
    isPrivate: boolean
  }[]
}

type Step = "loading" | "choose" | "select-repos" | "importing" | "done" | "error"

export function InstallOnRepoButton({ existingRepoNames }: { existingRepoNames: string[] }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<Step>("loading")
  const [installations, setInstallations] = React.useState<Installation[]>([])
  const [selectedRepos, setSelectedRepos] = React.useState<Set<number>>(new Set())
  const [importedCount, setImportedCount] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [needsReauth, setNeedsReauth] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [refreshing, setRefreshing] = React.useState(false)

  const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "gitguard-trust"

  const existingSet = React.useMemo(
    () => new Set(existingRepoNames),
    [existingRepoNames]
  )

  async function loadInstallations() {
    setStep("loading")
    setError(null)
    setNeedsReauth(false)
    setRefreshing(false)

    try {
      const res = await fetch("/api/github/installations")
      const data = await res.json()

      if (!res.ok) {
        if (data.needsReauth) {
          setNeedsReauth(true)
          setError(data.error)
          setStep("error")
          return
        }
        setError(data.error || "Failed to connect to GitHub.")
        setStep("error")
        return
      }

      setInstallations(data.installations)

      if (data.installations.length === 0) {
        setStep("choose")
      } else {
        setStep("select-repos")
      }
    } catch {
      setError("Network error. Please check your connection and try again.")
      setStep("error")
    }
  }

  async function refreshInstallations() {
    setRefreshing(true)
    setError(null)

    try {
      const res = await fetch("/api/github/installations")
      const data = await res.json()

      if (!res.ok) {
        if (data.needsReauth) {
          setNeedsReauth(true)
          setError(data.error)
          setStep("error")
          return
        }
        setError(data.error || "Failed to connect to GitHub.")
        return
      }

      setInstallations(data.installations)

      if (data.installations.length > 0) {
        setStep("select-repos")
      } else {
        setError("No GitGuard installation found yet. Make sure you completed the installation on GitHub.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setRefreshing(false)
    }
  }

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen) {
      setSelectedRepos(new Set())
      setImportedCount(0)
      setError(null)
      setSearch("")
      setNeedsReauth(false)
      loadInstallations()
    }
  }

  function toggleRepo(githubId: number) {
    setSelectedRepos((prev) => {
      const next = new Set(prev)
      if (next.has(githubId)) {
        next.delete(githubId)
      } else {
        next.add(githubId)
      }
      return next
    })
  }

  const allRepos = React.useMemo(
    () =>
      installations.flatMap((inst) =>
        inst.repos.map((r) => ({
          ...r,
          installationId: inst.installationId,
          accountLogin: inst.account.login,
          alreadyInstalled: existingSet.has(r.fullName),
        }))
      ),
    [installations, existingSet]
  )

  const filteredRepos = React.useMemo(() => {
    if (!search) return allRepos
    const q = search.toLowerCase()
    return allRepos.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q)
    )
  }, [allRepos, search])

  const selectableRepos = filteredRepos.filter((r) => !r.alreadyInstalled)

  function selectAll() {
    setSelectedRepos(new Set(selectableRepos.map((r) => r.githubId)))
  }

  function selectNone() {
    setSelectedRepos(new Set())
  }

  async function handleImport() {
    setStep("importing")
    setError(null)

    const reposToImport = allRepos
      .filter((r) => selectedRepos.has(r.githubId) && !r.alreadyInstalled)
      .map((r) => ({
        githubId: r.githubId,
        name: r.name,
        owner: r.owner,
        fullName: r.fullName,
      }))

    if (reposToImport.length === 0) {
      setStep("select-repos")
      return
    }

    try {
      const res = await fetch("/api/github/repos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repos: reposToImport }),
      })

      if (!res.ok) throw new Error("Import failed")

      const data = await res.json()
      setImportedCount(data.count)
      setStep("done")
    } catch {
      setError("Failed to import repositories. Please try again.")
      setStep("select-repos")
    }
  }

  function handleDone() {
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-md text-sm" size="sm">
          <Plus className="h-3.5 w-3.5" />
          Install on Repo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {step === "loading" && (
          <>
            <DialogHeader>
              <DialogTitle>Install on Repository</DialogTitle>
              <DialogDescription>
                Loading your GitHub installations...
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </>
        )}

        {step === "error" && (
          <>
            <DialogHeader>
              <DialogTitle>Connection Issue</DialogTitle>
              <DialogDescription>
                We couldn&apos;t load your GitHub installations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {error}
                  </p>
                  {needsReauth && (
                    <p className="text-xs text-muted-foreground">
                      Your GitHub session may have expired. Sign in again to reconnect.
                    </p>
                  )}
                </div>
              </div>

              {needsReauth ? (
                <Button
                  className="w-full gap-2"
                  onClick={() => signIn("github", { redirectTo: "/dashboard/repositories" })}
                >
                  <Github className="h-4 w-4" />
                  Sign in with GitHub
                </Button>
              ) : (
                <Button className="w-full gap-2" onClick={() => loadInstallations()}>
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              )}
            </div>
          </>
        )}

        {step === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle>Install GitGuard</DialogTitle>
              <DialogDescription>
                Install the GitGuard GitHub App to start protecting your repositories.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {error && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              )}

              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm text-foreground font-medium">
                  GitGuard needs to be installed as a GitHub App on your repositories.
                </p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-4">
                  <li>Click the button below to open GitHub</li>
                  <li>Choose an account or organization</li>
                  <li>Select which repositories to grant access to</li>
                  <li>Come back here and click &ldquo;Refresh&rdquo;</li>
                </ol>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => {
                  window.open(
                    `https://github.com/apps/${appSlug}/installations/new`,
                    "_blank"
                  )
                }}
              >
                <Github className="h-4 w-4" />
                Install GitHub App
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 text-sm"
                disabled={refreshing}
                onClick={() => refreshInstallations()}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {refreshing ? "Checking..." : "I've installed it — Refresh"}
              </Button>
            </div>
          </>
        )}

        {step === "select-repos" && (
          <>
            <DialogHeader>
              <DialogTitle>Select Repositories</DialogTitle>
              <DialogDescription>
                Choose which repositories to protect with GitGuard.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter repositories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {selectedRepos.size} of {selectableRepos.length} selected
                </span>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="hover:text-foreground transition-colors">
                    Select all
                  </button>
                  <span>/</span>
                  <button onClick={selectNone} className="hover:text-foreground transition-colors">
                    None
                  </button>
                </div>
              </div>

              <div className="max-h-[280px] overflow-y-auto rounded-md border border-border divide-y divide-border">
                {filteredRepos.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {search ? "No matching repositories" : "No repositories found"}
                  </div>
                )}
                {filteredRepos.map((repo) => {
                  const isSelected = selectedRepos.has(repo.githubId)
                  const disabled = repo.alreadyInstalled

                  return (
                    <button
                      key={repo.githubId}
                      disabled={disabled}
                      onClick={() => toggleRepo(repo.githubId)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        disabled
                          ? "opacity-50 cursor-not-allowed bg-muted/20"
                          : isSelected
                            ? "bg-accent/60"
                            : "hover:bg-accent/40"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                          disabled
                            ? "border-muted-foreground/30 bg-muted"
                            : isSelected
                              ? "border-primary bg-primary"
                              : "border-border"
                        )}
                      >
                        {(isSelected || disabled) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>

                      <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0">
                        <GitFork className="h-3 w-3 text-muted-foreground" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground truncate">
                            {repo.fullName}
                          </span>
                          {repo.isPrivate && (
                            <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>

                      {disabled && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          Already added
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    window.open(
                      `https://github.com/apps/${appSlug}/installations/new`,
                      "_blank"
                    )
                  }}
                >
                  <Github className="h-3 w-3" />
                  Configure on GitHub
                  <ExternalLink className="h-2.5 w-2.5" />
                </Button>
                <div className="flex-1" />
                <Button
                  size="sm"
                  disabled={selectedRepos.size === 0}
                  onClick={handleImport}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add {selectedRepos.size > 0 ? selectedRepos.size : ""} Repo{selectedRepos.size !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "importing" && (
          <>
            <DialogHeader>
              <DialogTitle>Importing Repositories</DialogTitle>
              <DialogDescription>
                Setting up GitGuard protection...
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle>Repositories Added</DialogTitle>
              <DialogDescription>
                {importedCount} {importedCount === 1 ? "repository has" : "repositories have"} been
                added to GitGuard.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-6 gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                These repos are now being monitored. Configure thresholds and enforcement from each
                repository&apos;s settings page.
              </p>
            </div>
            <Button onClick={handleDone} className="w-full">
              Done
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
