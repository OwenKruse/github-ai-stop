"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface RepoSettingsProps {
  repoId: number
  trustThreshold: number
  autoClose: boolean
  autoLabel: boolean
}

export function RepoSettings({ repoId, trustThreshold, autoClose, autoLabel }: RepoSettingsProps) {
  const [threshold, setThreshold] = useState(trustThreshold)
  const [close, setClose] = useState(autoClose)
  const [label, setLabel] = useState(autoLabel)
  const [saving, setSaving] = useState(false)

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
    </div>
  )
}
