"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertTriangle, Trash2 } from "lucide-react"

interface RepoSettingsProps {
  repoId: number
  repoName: string
  trustThreshold: number
  autoClose: boolean
  autoLabel: boolean
}

export function RepoSettings({ repoId, repoName, trustThreshold, autoClose, autoLabel }: RepoSettingsProps) {
  const router = useRouter()
  const [threshold, setThreshold] = useState(trustThreshold)
  const [close, setClose] = useState(autoClose)
  const [label, setLabel] = useState(autoLabel)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/repositories/${repoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trustThreshold: threshold,
          autoClose: close,
          autoLabel: label,
        }),
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/repositories/${repoId}`, { method: "DELETE" })
      if (res.ok) {
        router.push("/dashboard/repositories")
      }
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-1">Protection Settings</h2>
      <p className="text-xs text-muted-foreground mb-4">Configure trust thresholds and enforcement behavior</p>

      <div className="rounded-md border border-border bg-card divide-y divide-border">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="threshold" className="text-sm text-foreground">Minimum Trust Score</Label>
            <span className="text-sm font-mono font-semibold text-foreground">{threshold}</span>
          </div>
          <Slider
            id="threshold"
            value={[threshold]}
            onValueChange={([v]) => setThreshold(v)}
            max={100}
            step={5}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Contributors below this threshold will be flagged or auto-closed
          </p>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="auto-close" className="text-sm text-foreground">Auto-close low-trust PRs</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Immediately close PRs that don&apos;t meet the threshold
              </p>
            </div>
            <Switch id="auto-close" checked={close} onCheckedChange={setClose} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="auto-label" className="text-sm text-foreground">Auto-label trusted PRs</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add &quot;Trusted Contributor&quot; label to high-score PRs
              </p>
            </div>
            <Switch id="auto-label" checked={label} onCheckedChange={setLabel} />
          </div>
        </div>

        <div className="p-4">
          <Button size="sm" className="rounded-md" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-md border border-destructive/30 bg-card mt-6">
        <div className="p-4 border-b border-destructive/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Remove this repository</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Delete all GitGuard data for this repository, including activity history. This cannot be undone.
              </p>
            </div>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-md gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Remove repository</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove <span className="font-semibold text-foreground">{repoName}</span>? All activity events and settings for this repository will be permanently deleted.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Removing..." : "Remove Repository"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  )
}
