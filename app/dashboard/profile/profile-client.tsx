"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Github, Mail, Shield, Activity, Check } from "lucide-react"

interface ProfileClientProps {
  user: {
    id: string
    name: string
    email: string
    image: string
  }
  githubUsername: string
  provider: string
  activityCount: number
}

export function ProfileClient({ user, githubUsername, provider, activityCount }: ProfileClientProps) {
  const { update: updateSession } = useSession()
  const [name, setName] = useState(user.name)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const initials = (user.name || "U").slice(0, 2).toUpperCase()
  const hasChanges = name.trim() !== user.name

  async function handleSave() {
    if (!hasChanges) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (res.ok) {
        setSaved(true)
        await updateSession()
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account information and connected services
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="rounded-md border border-border bg-card p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarImage src={user.image} />
                <AvatarFallback className="bg-muted text-lg">{initials}</AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-semibold text-foreground">{user.name || "Unnamed"}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Github className="h-3 w-3" />
                  Connected
                </Badge>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  Auth provider
                </span>
                <span className="text-foreground font-medium capitalize">{provider}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" />
                  Recent events
                </span>
                <span className="text-foreground font-medium">{activityCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-md border border-border bg-card">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Account Details</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update your display name. Email and avatar are managed through GitHub.
              </p>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="max-w-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <div className="flex items-center gap-2 max-w-sm">
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="max-w-sm"
                  />
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground">Synced from your GitHub account</p>
              </div>
            </div>

            <div className="p-4 border-t border-border flex items-center gap-2">
              <Button
                size="sm"
                className="rounded-md"
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              {saved && (
                <span className="text-xs text-notion-green flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              )}
            </div>
          </div>

          {/* Connected Account */}
          <div className="rounded-md border border-border bg-card">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Connected Account</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your authentication provider and linked services
              </p>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-md bg-foreground/5">
                  <Github className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">GitHub</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Signed in via OAuth &middot; {user.email}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs text-notion-green border-notion-green/30">
                  Active
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
