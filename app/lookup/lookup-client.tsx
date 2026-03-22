"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TrustScoreBadge } from "@/components/trust-score-badge";
import {
  Shield,
  Search,
  Github,
  ArrowLeft,
  ExternalLink,
  GitPullRequest,
  GitMerge,
  FolderGit2,
  Clock,
  AlertCircle,
  ShieldCheck,
  ShieldBan,
  Users,
  BookOpen,
  Info,
} from "lucide-react";

interface LookupResult {
  source: "tracked" | "github";
  username: string;
  avatarUrl: string;
  trustScore: number;
  totalPRs: number;
  mergedPRs: number;
  mergeRate: number;
  accountAgeYears: number;
  reposActiveIn: number;
  recentEventCount: number;
  isWhitelisted: boolean;
  isBlocked: boolean;
  lastActiveAt: string | null;
  bio?: string;
  publicRepos?: number;
  followers?: number;
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Trusted";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Low";
  return "Very Low";
}

function getScoreAccent(score: number) {
  if (score >= 80) return "green" as const;
  if (score >= 60) return "orange" as const;
  if (score >= 40) return "blue" as const;
  return "red" as const;
}

const accentMap = {
  green: "bg-notion-bg-green text-notion-green",
  red: "bg-notion-bg-red text-notion-red",
  blue: "bg-notion-bg-blue text-notion-blue",
  orange: "bg-notion-bg-orange text-notion-orange",
};

const accentBorderMap = {
  green: "border-l-notion-green",
  red: "border-l-notion-red",
  blue: "border-l-notion-blue",
  orange: "border-l-notion-orange",
};

function formatAccountAge(years: number) {
  if (years < 1) {
    const months = Math.round(years * 12);
    return months <= 1 ? "< 1 month" : `${months} months`;
  }
  return `${Math.round(years * 10) / 10} years`;
}

export function LookupClient() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const resultRef = useRef(null);
  const resultInView = useInView(resultRef, { once: false });

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setHasSearched(true);

    try {
      const res = await fetch(
        `/api/lookup?username=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(
          body?.error ?? (res.status === 404 ? "GitHub user not found" : "Something went wrong")
        );
        return;
      }
      setResult(await res.json());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const accent = result ? getScoreAccent(result.trustScore) : "green";

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Nav */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
      >
        <div className="max-w-6xl mx-auto px-6 flex h-12 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Shield className="h-5 w-5 text-foreground shrink-0 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              GitGuard
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="rounded-full px-4 font-medium">
                Dashboard
              </Button>
            </Link>
          </nav>
        </div>
      </motion.header>

      <main className="flex-1">
        {/* Hero + Search */}
        <section className="relative pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="max-w-2xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="text-center space-y-4 mb-10"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground">
                <Search className="h-3 w-3" />
                <span>Public contributor lookup</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground">
                Look up any{" "}
                <span className="text-muted-foreground">contributor</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                Enter a GitHub username to see their trust score and
                contribution profile across the open source ecosystem.
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              onSubmit={handleSearch}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter GitHub username..."
                  className="pl-9 h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !query.trim()}
                className="h-11 px-6 rounded-md font-medium"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Looking up
                  </span>
                ) : (
                  "Look up"
                )}
              </Button>
            </motion.form>
          </div>
        </section>

        {/* Results */}
        <section className="pb-24">
          <div className="max-w-2xl mx-auto px-6" ref={resultRef}>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="rounded-md border border-border bg-card p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-10 w-16 rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-16 rounded-md" />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {error && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-md border border-border bg-card p-6 text-center"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-notion-bg-red text-notion-red mb-4">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  User not found
                </p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div
                key={result.username}
                initial={{ opacity: 0, y: 16 }}
                animate={
                  resultInView
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 16 }
                }
                transition={{
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="space-y-4"
              >
                {/* Profile card */}
                <div
                  className={`rounded-md border border-border border-l-2 ${accentBorderMap[accent]} bg-card p-6`}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <img
                      src={result.avatarUrl}
                      alt={result.username}
                      className="h-16 w-16 rounded-full border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-foreground truncate">
                          {result.username}
                        </h2>
                        <a
                          href={`https://github.com/${result.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      {result.bio && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">
                          {result.bio}
                        </p>
                      )}
                    
                    </div>
                    <div className="text-right shrink-0">
                      <TrustScoreBadge
                        score={result.trustScore}
                        size="md"
                        className="text-2xl px-3 py-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {getScoreLabel(result.trustScore)}
                      </p>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <StatTile
                      icon={GitPullRequest}
                      label="Total PRs"
                      value={String(result.totalPRs)}
                      accent="blue"
                    />
                    <StatTile
                      icon={GitMerge}
                      label="Merge Rate"
                      value={`${result.mergeRate}%`}
                      accent={result.mergeRate >= 50 ? "green" : "orange"}
                    />
                    <StatTile
                      icon={FolderGit2}
                      label="Repos Active In"
                      value={String(result.reposActiveIn)}
                      accent="orange"
                    />
                    <StatTile
                      icon={Clock}
                      label="Account Age"
                      value={formatAccountAge(result.accountAgeYears)}
                      accent="blue"
                    />
                  </div>

                  {/* Extra GitHub-only stats */}
                  {result.source === "github" && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {result.publicRepos !== undefined && (
                        <StatTile
                          icon={BookOpen}
                          label="Public Repos"
                          value={String(result.publicRepos)}
                          accent="green"
                        />
                      )}
                      {result.followers !== undefined && (
                        <StatTile
                          icon={Users}
                          label="Followers"
                          value={String(result.followers)}
                          accent="blue"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Explanation card for estimated scores */}
                {result.source === "github" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground"
                  >
                    <p>
                      <span className="font-medium text-foreground">
                        Based on public GitHub activity.
                      </span>
                   
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {!result && !loading && !error && !hasSearched && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center py-12 text-muted-foreground"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent mb-4">
                  <Search className="h-5 w-5" />
                </div>
                <p className="text-sm">
                  Search for a GitHub user to see their trust score
                </p>
              </motion.div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">
                GitGuard
              </span>
              <span className="text-muted-foreground text-xs">&copy; 2026</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <a
                href="#"
                className="hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: "green" | "red" | "blue" | "orange";
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <div className={`rounded-md p-1 ${accentMap[accent]}`}>
          <Icon className="h-3 w-3" />
        </div>
      </div>
      <span className="text-lg font-semibold tracking-tight text-foreground font-mono tabular-nums">
        {value}
      </span>
    </div>
  );
}
