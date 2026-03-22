"use client"

import Link from "next/link"
import { useRef } from "react"
import { motion, useInView, useScroll, useTransform } from "motion/react"
import { Button } from "@/components/ui/button"
import { GitHubButton } from "@/components/github-button"
import {
  Shield,
  Bot,
  Zap,
  Gauge,
  Github,
  ArrowRight,
  CheckCircle2,
  XCircle,
  GitPullRequest,
  Eye,
  ShieldCheck,
  ShieldAlert,
  FolderGit2,
} from "lucide-react"

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function Counter({
  value,
  suffix = "",
  delay = 0,
}: {
  value: string
  suffix?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground"
    >
      {value}
      {suffix}
    </motion.span>
  )
}

function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative w-full max-w-4xl mx-auto"
    >
      <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden backdrop-blur-md">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-border" />
            <div className="h-2.5 w-2.5 rounded-full bg-border" />
            <div className="h-2.5 w-2.5 rounded-full bg-border" />
          </div>
          <div className="flex-1 flex justify-center">
            <span className="text-[11px] text-muted-foreground font-mono">
              gitguard.dev/dashboard
            </span>
          </div>
        </div>

        {/* Mockup content */}
        <div className="p-6 space-y-4">
          {/* Mini stat cards row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "PRs This Week", value: "47", icon: GitPullRequest, accent: "green" as const },
              { label: "Spam Blocked", value: "12", icon: ShieldAlert, accent: "red" as const },
              { label: "Avg Trust Score", value: "72", icon: Gauge, accent: "blue" as const },
              { label: "Active Repos", value: "6", icon: FolderGit2, accent: "orange" as const },
            ].map((card) => {
              const accentMap = {
                green: "bg-notion-bg-green text-notion-green",
                red: "bg-notion-bg-red text-notion-red",
                blue: "bg-notion-bg-blue text-notion-blue",
                orange: "bg-notion-bg-orange text-notion-orange",
              }
              return (
                <div key={card.label} className="rounded-md border border-border bg-background p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{card.label}</span>
                    <div className={`rounded-md p-1 ${accentMap[card.accent]}`}>
                      <card.icon className="h-3 w-3" />
                    </div>
                  </div>
                  <span className="text-lg font-semibold tracking-tight text-foreground">{card.value}</span>
                </div>
              )
            })}
          </div>

          {/* Mini activity rows */}
          <div className="rounded-md border border-border bg-background">
            {[
              { user: "sarah-dev", action: "Trusted", pr: "Fix responsive layout", score: 94, actionStyle: "bg-notion-bg-green text-notion-green" },
              { user: "new-contrib", action: "Flagged", pr: "Update README format", score: 42, actionStyle: "bg-notion-bg-orange text-notion-orange" },
              { user: "pr-spam-bot", action: "Closed", pr: "Update all dependencies", score: 6, actionStyle: "bg-notion-bg-red text-notion-red" },
            ].map((row, i) => (
              <div key={row.user} className={`flex items-center gap-3 px-3 py-2 ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-medium text-muted-foreground">{row.user.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-foreground">{row.user}</span>
                  <p className="text-[10px] text-muted-foreground truncate">#{100 + i} {row.pr}</p>
                </div>
                <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 ${row.actionStyle}`}>{row.action}</span>
                <span className="text-[10px] font-mono font-medium text-muted-foreground tabular-nums">{row.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export type PlatformStats = {
  totalPRs: number
  spamBlocked: number
  totalRepos: number
  totalContributors: number
}

function formatCompact(n: number): { value: string; suffix: string } {
  if (n >= 1_000_000) {
    const v = n / 1_000_000
    return { value: v % 1 === 0 ? v.toFixed(0) : v.toFixed(1), suffix: "M" }
  }
  if (n >= 1_000) {
    const v = n / 1_000
    return { value: v % 1 === 0 ? v.toFixed(0) : v.toFixed(1), suffix: "K" }
  }
  return { value: n.toLocaleString(), suffix: "" }
}

export default function LandingPage({ stats }: { stats: PlatformStats }) {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.97])

  const features = [
    {
      icon: Shield,
      title: "Cross-Repo Scoring",
      desc: "Reputation travels. A contributor's history across all of open source informs their score on your repo.",
      accent: "green" as const,
    },
    {
      icon: Bot,
      title: "Bot Net Detection",
      desc: "50 PRs across 50 repos in one hour? Pattern flagged, score tanked, PRs quarantined. Automatically.",
      accent: "red" as const,
    },
    {
      icon: Zap,
      title: "Instant Enforcement",
      desc: "Low-trust PRs never reach your queue. Auto-closed with a transparent explanation. Zero maintainer friction.",
      accent: "blue" as const,
    },
    {
      icon: Gauge,
      title: "Full Control",
      desc: "Set your own thresholds. Whitelist trusted contributors. Toggle enforcement per-repo from the dashboard.",
      accent: "orange" as const,
    },
  ]

  const accentMap = {
    green: "bg-notion-bg-green text-notion-green",
    red: "bg-notion-bg-red text-notion-red",
    blue: "bg-notion-bg-blue text-notion-blue",
    orange: "bg-notion-bg-orange text-notion-orange",
  }

  const steps = [
    {
      num: "01",
      icon: Github,
      title: "Install",
      desc: "One-click GitHub App installation. Select the repos you want to protect.",
    },
    {
      num: "02",
      icon: Eye,
      title: "Analyze",
      desc: "Every PR triggers a webhook. Our engine scores the contributor in milliseconds.",
    },
    {
      num: "03",
      icon: ShieldCheck,
      title: "Enforce",
      desc: "Trusted PRs get labeled. Spam gets closed. You review what matters.",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
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
            <Link href="#features">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Features
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                How it works
              </Button>
            </Link>
            <Link href="/lookup">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Lookup
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Sign In
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
        {/* Hero */}
        <motion.section
          ref={heroRef}
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative pt-20 pb-28 md:pt-28 md:pb-36"
        >
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-notion-green" />
                <span>
                  Now protecting <span className="text-foreground font-medium">{stats.totalRepos.toLocaleString()}</span> {stats.totalRepos === 1 ? "repository" : "repositories"}
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tighter leading-[0.95] max-w-4xl mx-auto text-foreground"
              >
                Your repos deserve{" "}
                <span className="text-muted-foreground">
                  better pull requests.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.2,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              >
                GitGuard scores every contributor across the open source ecosystem.
                Spam PRs are quarantined automatically. You only see what matters.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2"
              >
                <GitHubButton className="font-medium rounded-full h-11 px-7 text-sm">
                  Get Started Free
                </GitHubButton>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="rounded-full h-11 px-7 text-sm gap-2"
                  >
                    Live Demo
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            <div className="mt-16 md:mt-20">
              <DashboardMockup />
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <section className="relative py-20 border-t border-border">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 md:divide-x divide-border">
              {[
                { ...formatCompact(stats.totalPRs), label: "Pull requests analyzed", delay: 0 },
                { ...formatCompact(stats.spamBlocked), label: "Spam PRs blocked", delay: 0.15 },
                { ...formatCompact(stats.totalContributors), label: "Contributors scored", delay: 0.3 },
              ].map((stat) => (
                <AnimatedSection
                  key={stat.label}
                  delay={stat.delay}
                  className="text-center px-8"
                >
                  <Counter value={stat.value} suffix={stat.suffix} delay={stat.delay + 0.2} />
                  <p className="text-muted-foreground mt-2 text-sm">{stat.label}</p>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="relative py-24 md:py-32 border-t border-border">
          <div className="max-w-6xl mx-auto px-6">
            <AnimatedSection className="text-center mb-16">
              <p className="text-xs font-medium text-notion-green tracking-wide uppercase mb-3">
                How it works
              </p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground">
                Three steps. Zero spam.
              </h2>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-4">
              {steps.map((step, i) => (
                <AnimatedSection key={step.title} delay={i * 0.12}>
                  <div className="group relative rounded-md border border-border bg-card p-6 hover:bg-accent/40 transition-colors h-full">
                    <span className="text-6xl font-bold text-border absolute top-4 right-4 select-none group-hover:text-muted-foreground/20 transition-colors">
                      {step.num}
                    </span>

                    <div className="relative z-10">
                      <div className="mb-5 inline-flex items-center justify-center h-10 w-10 rounded-md bg-notion-bg-green text-notion-green">
                        <step.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="relative py-24 md:py-32 border-t border-border">
          <div className="max-w-6xl mx-auto px-6">
            <AnimatedSection className="text-center mb-16">
              <p className="text-xs font-medium text-notion-green tracking-wide uppercase mb-3">
                Features
              </p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter max-w-2xl mx-auto text-foreground">
                Everything you need to protect open source
              </h2>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <AnimatedSection key={feature.title} delay={i * 0.08}>
                  <div className="group rounded-md border border-border bg-card p-6 hover:bg-accent/40 transition-colors h-full">
                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 mt-0.5 inline-flex items-center justify-center h-9 w-9 rounded-md ${accentMap[feature.accent]}`}>
                        <feature.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-1.5">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="relative py-24 md:py-32 border-t border-border">
          <div className="max-w-6xl mx-auto px-6">
            <AnimatedSection className="text-center mb-16">
              <p className="text-xs font-medium text-notion-green tracking-wide uppercase mb-3">
                See the difference
              </p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground">
                Trust at a glance
              </h2>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <AnimatedSection delay={0}>
                <div className="rounded-md border border-border border-l-2 border-l-notion-green bg-card p-6">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="rounded-md p-1.5 bg-notion-bg-green text-notion-green">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      Trusted Contributor
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      ["Trust Score", "94"],
                      ["Merge Rate", "87.5%"],
                      ["Total PRs", "287 across 12 repos"],
                      ["Account Age", "5.2 years"],
                    ].map(([label, val]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-3 border-t border-border">
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-notion-bg-green text-notion-green">
                      PR automatically labeled as trusted
                    </span>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.12}>
                <div className="rounded-md border border-border border-l-2 border-l-notion-red bg-card p-6">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="rounded-md p-1.5 bg-notion-bg-red text-notion-red">
                      <XCircle className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      Spam Account
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      ["Trust Score", "6"],
                      ["Merge Rate", "0.2%"],
                      ["Total PRs", "1,247 across 189 repos"],
                      ["Account Age", "36 days"],
                    ].map(([label, val]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-3 border-t border-border">
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-notion-bg-red text-notion-red">
                      PR auto-closed with explanation
                    </span>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-24 md:py-32 border-t border-border">
          <AnimatedSection className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-5 text-foreground">
              Ready to reclaim{" "}
              <span className="text-muted-foreground">
                your review queue?
              </span>
            </h2>
            <p className="text-base text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of maintainers who stopped reviewing spam and started
              shipping faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <GitHubButton className="font-medium rounded-full h-11 px-7 text-sm">
                Get Started Free
              </GitHubButton>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="rounded-full h-11 px-7 text-sm gap-2"
                >
                  View Demo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">GitGuard</span>
              <span className="text-muted-foreground text-xs">&copy; 2026</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <a
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Documentation
              </a>
              <a
                href="#"
                className="hover:text-foreground transition-colors"
              >
                API
              </a>
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
  )
}
