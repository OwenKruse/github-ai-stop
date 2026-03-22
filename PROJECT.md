# GitGuard

**A cross-repo trust scoring system for open source maintainers.**

GitGuard is a GitHub App + API that calculates a dynamic trust score for contributors across the open source ecosystem. It tracks metrics like merge rates, review cycles, and mass-submission behavior to automatically flag or quarantine low-quality pull requests before they reach the maintainer's review queue.

---

## Problem

Open source maintainers are flooded with low-effort, spam, and bot-generated PRs. There is no cross-repo reputation signal to distinguish trusted contributors from bad actors.

## How It Works

When a contributor submits a 5,000-line PR but has a 2% merge rate across 30 other repos, GitGuard automatically flags or quarantines the PR, saving maintainers time and protecting project quality.

---

## Architecture

Single Next.js application — no separate backend. Webhooks, scoring, enforcement, and the dashboard all live in one deployment.

### 1. Ingestion Layer — GitHub App Webhooks

A GitHub App that maintainers install on their repositories. When a user opens, updates, or closes a pull request, GitHub sends a webhook payload to a Next.js Route Handler (`app/api/webhooks/github/route.ts`).

**Data captured per event:**
- Who submitted the PR
- Lines of code changed
- Whether the maintainer merged, closed, or marked it as spam

### 2. Scoring Engine

A TypeScript module that processes webhook events and computes a dynamic **Trust Score** per contributor. Runs server-side within Next.js.

**Score inputs:**
- Ratio of merged PRs to closed/rejected PRs
- Average time a PR stays open before action
- Contributor's GitHub account age
- Cross-repo submission velocity (PRs per hour across distinct repos)

**Bot detection:** If a user submits 50 PRs across 50 repos in one hour, the engine flags the behavior as a bot net and tanks their score immediately.

### 3. Enforcement Layer

After scoring, the same Route Handler acts on scores via the GitHub REST API (using `octokit`):

| Score Range | Action |
|---|---|
| High trust | Attach a "Trusted Contributor" label to the PR |
| Low trust | Comment with a warning (e.g., "Flagged for low cross-repo reputation") and auto-close the PR |

### 4. Data Layer — Turso (libSQL)

Turso provides edge-hosted SQLite via `@libsql/client`. Stores:
- Contributor scores and PR event history
- Maintainer settings (thresholds, whitelist, auto-close rules)
- Repository configuration

### 5. Maintainer Dashboard

A web dashboard where maintainers log in with **GitHub OAuth** and:

- **Set risk thresholds** — large projects (e.g., React) can set strict filters; smaller projects can be lenient
- **View analytics** — see PR volume, spam rates, and contributor quality over time
- **Whitelist contributors** — manually override scores for known collaborators

---

## Tech Stack

| Layer | Technology |
|---|---|
| App | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Database | Turso (libSQL) via `@libsql/client` |
| Auth | GitHub OAuth |
| GitHub Integration | GitHub App (webhooks), `octokit` (REST API) |
| Package Manager | Bun |

