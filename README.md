# GitGuard Frontend

A modern Next.js dashboard for managing cross-repo trust scoring and PR protection.

## Built With

- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with RSC support
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling with the new CSS-first configuration
- **shadcn/ui** - High-quality component library
- **Recharts** - Data visualization for analytics
- **Lucide React** - Icon library
- **next-themes** - Dark mode support

## Getting Started

### Development

Start the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build

Build for production:

```bash
bun run build
```

### Start Production Server

```bash
bun run start
```

## Project Structure

```
app/
├── page.tsx                        # Landing page
├── login/page.tsx                  # Login page
├── dashboard/
│   ├── layout.tsx                  # Dashboard shell with sidebar
│   ├── page.tsx                    # Overview with charts
│   ├── repositories/
│   │   ├── page.tsx                # Repository list
│   │   └── [repo]/page.tsx         # Repository detail & settings
│   ├── contributors/page.tsx       # Contributor management
│   └── activity/page.tsx           # Activity feed
components/
├── ui/                             # shadcn/ui components
├── contributor-avatar.tsx          # Avatar with username
├── github-button.tsx               # GitHub OAuth button
├── stat-card.tsx                   # Dashboard metric card
├── theme-provider.tsx              # Theme context provider
├── theme-toggle.tsx                # Dark/light mode toggle
└── trust-score-badge.tsx           # Colored trust score badge
lib/
├── utils.ts                        # cn() utility
└── mock-data.ts                    # Realistic mock data
```

## Features

### Landing Page
- Hero section with CTAs
- How it works (3-step process)
- Feature grid (4 key features)
- Trust score comparison examples
- Footer with links

### Dashboard
- **Overview**: Stat cards, PR volume chart, trust score distribution, spam rate trend, recent activity table
- **Repositories**: List of protected repos with thresholds, spam rates, and configure buttons
- **Repository Detail**: Threshold slider, auto-close/auto-label toggles, whitelist management, recent PRs
- **Contributors**: Searchable/sortable table with trust scores, merge rates, repo counts, status badges
- **Activity Feed**: Chronological events with filters by repo and action type, action summaries

### Design System
- Dark mode by default (developer-focused)
- Green accent for trusted, red for flagged/blocked
- Fully responsive with collapsible sidebar on mobile
- Consistent shadcn/ui components throughout

## Mock Data

All pages use realistic mock data from `lib/mock-data.ts`:
- 6 repositories with varied settings
- 15 contributors with trust scores from 6-96
- 20 activity events across different repos
- Chart data for the last 8 days

## Notes

- No backend integration yet - all data is static/mock
- GitHub OAuth button is visual only (logs to console)
- All dashboard features are fully navigable and interactive
- Production build tested and passing
