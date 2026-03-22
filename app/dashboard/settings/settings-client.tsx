"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Shield,
  Bell,
  AlertTriangle,
  LogOut,
  Check,
  Palette,
} from "lucide-react"
import { useTheme } from "next-themes"

export function SettingsClient() {
  const { theme, setTheme } = useTheme()

  const [defaultThreshold, setDefaultThreshold] = useState(65)
  const [defaultAutoClose, setDefaultAutoClose] = useState(true)
  const [defaultAutoLabel, setDefaultAutoLabel] = useState(true)

  const [emailOnFlag, setEmailOnFlag] = useState(true)
  const [emailOnAutoClose, setEmailOnAutoClose] = useState(true)
  const [emailDigest, setEmailDigest] = useState(false)

  const [protectionSaved, setProtectionSaved] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)

  function handleSaveProtection() {
    setProtectionSaved(true)
    setTimeout(() => setProtectionSaved(false), 2000)
  }

  function handleSaveNotifications() {
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 2000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Global preferences and default configurations for GitGuard
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Appearance */}
        <div className="rounded-md border border-border bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 ml-6">
              Customize how GitGuard looks
            </p>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">Theme</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose between light, dark, or system theme
                </p>
              </div>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Default Protection */}
        <div className="rounded-md border border-border bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Default Protection</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 ml-6">
              Defaults applied to newly connected repositories. You can override these per-repo.
            </p>
          </div>

          <div className="divide-y divide-border">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Default Trust Threshold</Label>
                <span className="text-sm font-mono font-semibold text-foreground">{defaultThreshold}</span>
              </div>
              <Slider
                value={[defaultThreshold]}
                onValueChange={([v]) => setDefaultThreshold(v)}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Contributors below this score will be flagged on new repositories
              </p>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm">Auto-close low-trust PRs</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically close PRs from untrusted contributors
                  </p>
                </div>
                <Switch checked={defaultAutoClose} onCheckedChange={setDefaultAutoClose} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm">Auto-label trusted PRs</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Attach a &ldquo;Trusted Contributor&rdquo; label to qualifying PRs
                  </p>
                </div>
                <Switch checked={defaultAutoLabel} onCheckedChange={setDefaultAutoLabel} />
              </div>
            </div>

            <div className="p-4 flex items-center gap-2">
              <Button size="sm" className="rounded-md" onClick={handleSaveProtection}>
                Save Defaults
              </Button>
              {protectionSaved && (
                <span className="text-xs text-notion-green flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-md border border-border bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 ml-6">
              Control when and how GitGuard notifies you about events
            </p>
          </div>

          <div className="divide-y divide-border">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm">Flagged PR alerts</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Email when a PR is flagged for review
                  </p>
                </div>
                <Switch checked={emailOnFlag} onCheckedChange={setEmailOnFlag} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm">Auto-close alerts</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Email when a PR is automatically closed
                  </p>
                </div>
                <Switch checked={emailOnAutoClose} onCheckedChange={setEmailOnAutoClose} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm">Weekly digest</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Receive a weekly summary of all activity
                  </p>
                </div>
                <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
              </div>
            </div>

            <div className="p-4 flex items-center gap-2">
              <Button size="sm" className="rounded-md" onClick={handleSaveNotifications}>
                Save Preferences
              </Button>
              {notifSaved && (
                <span className="text-xs text-notion-green flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-md border border-destructive/30 bg-card">
          <div className="p-4 border-b border-destructive/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Sign out of GitGuard</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  End your current session. You&apos;ll need to sign in again.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-md gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => signOut({ redirectTo: "/" })}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
