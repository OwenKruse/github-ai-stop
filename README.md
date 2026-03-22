# GitGuard

A GitHub App that computes cross-repository trust scores for pull request contributors and automatically labels, flags, or closes PRs based on configurable thresholds. Designed to protect open source repos from AI-generated spam PRs at scale.

## How It Works

1. **Install** the GitGuard GitHub App on your repositories.
2. **Analyze** -- when a PR is opened, GitGuard computes a trust score for the contributor based on their activity across all of GitHub (not just your repo).
3. **Enforce** -- based on the score and your per-repo threshold, the PR is automatically labeled as trusted, flagged with a warning comment, or closed.

## Trust Score Algorithm

Each contributor receives a 0-100 trust score computed from five signals:

| Signal | Weight | How it works |
|---|---|---|
| **Merge quality** | 40% | Bayesian-smoothed merge ratio. Needs 5+ PRs before real data dominates the prior, preventing one-hit-wonder exploits. |
| **Account age** | 25% | Logarithmic ramp capped at 5 years. New accounts score near 0; a 1yr account scores ~62. |
| **Volume credibility** | 20% | Square-root curve on merged PRs. 50+ merged PRs gives full credit. |
| **Cross-repo spread** | -15% | Penalizes high repo spread only when merge rate is low (<30%). Catches bot-net patterns. |
| **Velocity penalty** | up to -50% | Detects account takeover by comparing 24h event count to historical baseline. A 20x spike halves the score. |

Hard overrides: whitelisted contributors always score 100, blocked contributors always score 0. Bot detection hard-caps at 10 when a contributor touches >30 repos with <5% merge rate.

## Architecture

- **GitHub App** receives webhook events for PR opens/closes/merges and installation changes
- **Trust scoring** enriches local tracked data with GitHub-wide PR stats via the Search API
- **Enforcement** applies labels, warning comments, or auto-closes via the GitHub installation API
- **Dashboard** provides real-time visibility into protection metrics, contributor management, and per-repo configuration

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Auth | NextAuth v5 with GitHub OAuth |
| Database | Turso (libSQL/SQLite) via Drizzle ORM |
| GitHub integration | Octokit (GitHub App + webhooks) |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI, Recharts |
| Testing | Vitest |

## Project Structure

```
app/
  page.tsx                             # Landing page
  login/page.tsx                       # GitHub OAuth login
  lookup/                              # Public contributor lookup
    page.tsx
    lookup-client.tsx
  api/
    auth/[...nextauth]/route.ts        # NextAuth handlers
    webhooks/github/route.ts           # GitHub webhook receiver
    lookup/route.ts                    # Public contributor lookup API
    repositories/[id]/route.ts         # Repo settings PATCH
    contributors/[id]/route.ts         # Whitelist/block PATCH
    contributors/search/route.ts       # Contributor search
    github/installations/route.ts      # GitHub App installations
    github/repos/import/route.ts       # Import repos from GitHub App
    user/route.ts                      # User profile GET/PATCH
  dashboard/
    layout.tsx                         # Dashboard shell with sidebar
    page.tsx                           # Overview: stats, charts, recent activity
    dashboard-charts.tsx               # PR volume, spam rate, trust distribution
    repositories/
      page.tsx                         # Repository list with stats
      install-on-repo.tsx              # GitHub App install dialog
      [repo]/page.tsx                  # Repo detail, settings, whitelist, PR list
    contributors/page.tsx              # Contributor table (sortable, searchable)
    activity/page.tsx                  # Activity feed with filters and CSV export
    profile/page.tsx                   # User profile
    settings/page.tsx                  # App settings
lib/
  auth.ts                              # NextAuth config (GitHub provider, Drizzle adapter)
  scoring.ts                           # Trust score algorithm
  db/
    index.ts                           # Drizzle client (Turso)
    schema.ts                          # Database schema (repos, contributors, events)
    queries.ts                         # Dashboard query functions
  github/
    app.ts                             # GitHub App singleton (Octokit)
    enforce.ts                         # PR enforcement (label, comment, close)
    fetch-contributor-stats.ts         # Cross-repo stats via GitHub Search API
components/
  ui/                                  # shadcn/ui primitives
  contributor-avatar.tsx
  trust-score-badge.tsx
  stat-card.tsx
  date-range-calendar.tsx
  github-button.tsx
  theme-provider.tsx / theme-toggle.tsx
```

## Getting Started

### Prerequisites

- Node.js 20+
- A [Turso](https://turso.tech) database
- A GitHub App configured with webhook permissions for `pull_request` and `installation` events
- GitHub OAuth app for user authentication

### Environment Variables

```
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

GITHUB_APP_ID=
GITHUB_APP_SLUG=
NEXT_PUBLIC_GITHUB_APP_SLUG=
GITHUB_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=

# Optional: for higher GitHub Search API rate limits on the lookup page
GITHUB_PAT=
```

### Development

```bash
pnpm install
pnpm db:push        # Push schema to database
pnpm dev             # Start dev server at http://localhost:3000
```

### Testing

```bash
pnpm test            # Run all tests (Vitest)
```

### Production

```bash
pnpm build
pnpm start
```

### Database

```bash
pnpm db:generate     # Generate migration from schema changes
pnpm db:push         # Push schema directly to database
pnpm db:studio       # Open Drizzle Studio GUI
```

## Key Features

- **Cross-repo trust scoring** -- scores are computed from a contributor's activity across all of GitHub, not just your tracked repos
- **Three enforcement tiers** -- trusted (green label), flagged (warning comment), auto-closed (closed with explanation)
- **Per-repo configuration** -- adjustable trust thresholds, auto-close toggle, auto-label toggle
- **Contributor management** -- whitelist trusted contributors, block known spammers
- **Public lookup** -- anyone can search a GitHub username to see their trust score
- **Bot detection** -- hard-caps scores for accounts with high repo spread and near-zero merge rates
- **Account takeover defense** -- velocity penalty detects hijacked dormant accounts based on 24h activity spikes
- **One-hit-wonder protection** -- Bayesian smoothing prevents gaming the score with a single merged typo fix
- **Dashboard analytics** -- PR volume charts, spam rate trends, trust score distributions, activity feed with filters and CSV export
