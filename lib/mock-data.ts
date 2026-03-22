export interface Repository {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  trustThreshold: number;
  autoClose: boolean;
  autoLabel: boolean;
  prsThisMonth: number;
  spamRate: number;
  status: "active" | "paused" | "error";
  installedAt: string;
}

export interface Contributor {
  id: string;
  username: string;
  avatarUrl: string;
  trustScore: number;
  totalPRs: number;
  mergedPRs: number;
  mergeRate: number;
  reposActiveIn: number;
  lastActiveAt: string;
  accountAge: number;
  isWhitelisted?: boolean;
  isBlocked?: boolean;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  contributor: {
    username: string;
    avatarUrl: string;
  };
  repository: {
    name: string;
    owner: string;
  };
  prTitle: string;
  prNumber: number;
  action: "labeled_trusted" | "flagged" | "auto_closed" | "whitelisted";
  trustScore: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export const mockRepositories: Repository[] = [
  {
    id: "1",
    name: "frontend-ui",
    owner: "acme-corp",
    fullName: "acme-corp/frontend-ui",
    trustThreshold: 65,
    autoClose: true,
    autoLabel: true,
    prsThisMonth: 142,
    spamRate: 12.7,
    status: "active",
    installedAt: "2026-01-15T10:30:00Z",
  },
  {
    id: "2",
    name: "api-gateway",
    owner: "acme-corp",
    fullName: "acme-corp/api-gateway",
    trustThreshold: 70,
    autoClose: true,
    autoLabel: true,
    prsThisMonth: 89,
    spamRate: 8.9,
    status: "active",
    installedAt: "2026-01-20T14:20:00Z",
  },
  {
    id: "3",
    name: "database-utils",
    owner: "acme-corp",
    fullName: "acme-corp/database-utils",
    trustThreshold: 60,
    autoClose: false,
    autoLabel: true,
    prsThisMonth: 34,
    spamRate: 5.9,
    status: "active",
    installedAt: "2026-02-01T09:00:00Z",
  },
  {
    id: "4",
    name: "design-system",
    owner: "acme-corp",
    fullName: "acme-corp/design-system",
    trustThreshold: 75,
    autoClose: true,
    autoLabel: true,
    prsThisMonth: 67,
    spamRate: 14.9,
    status: "active",
    installedAt: "2026-02-10T11:45:00Z",
  },
  {
    id: "5",
    name: "cli-tools",
    owner: "acme-corp",
    fullName: "acme-corp/cli-tools",
    trustThreshold: 55,
    autoClose: false,
    autoLabel: true,
    prsThisMonth: 23,
    spamRate: 4.3,
    status: "active",
    installedAt: "2026-02-25T16:30:00Z",
  },
  {
    id: "6",
    name: "docs",
    owner: "acme-corp",
    fullName: "acme-corp/docs",
    trustThreshold: 50,
    autoClose: false,
    autoLabel: true,
    prsThisMonth: 156,
    spamRate: 22.4,
    status: "paused",
    installedAt: "2026-03-01T08:15:00Z",
  },
];

export const mockContributors: Contributor[] = [
  {
    id: "1",
    username: "sarah-dev",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    trustScore: 94,
    totalPRs: 287,
    mergedPRs: 251,
    mergeRate: 87.5,
    reposActiveIn: 12,
    lastActiveAt: "2026-03-17T15:23:00Z",
    accountAge: 5.2,
    isWhitelisted: true,
  },
  {
    id: "2",
    username: "alex-contributor",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    trustScore: 88,
    totalPRs: 142,
    mergedPRs: 119,
    mergeRate: 83.8,
    reposActiveIn: 8,
    lastActiveAt: "2026-03-18T09:12:00Z",
    accountAge: 3.7,
  },
  {
    id: "3",
    username: "bot-hunter-9000",
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=bot9000",
    trustScore: 12,
    totalPRs: 543,
    mergedPRs: 8,
    mergeRate: 1.5,
    reposActiveIn: 87,
    lastActiveAt: "2026-03-18T10:45:00Z",
    accountAge: 0.2,
    isBlocked: true,
  },
  {
    id: "4",
    username: "maria-opensource",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
    trustScore: 91,
    totalPRs: 203,
    mergedPRs: 178,
    mergeRate: 87.7,
    reposActiveIn: 15,
    lastActiveAt: "2026-03-16T14:30:00Z",
    accountAge: 4.8,
  },
  {
    id: "5",
    username: "newbie-contributor",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=newbie",
    trustScore: 45,
    totalPRs: 12,
    mergedPRs: 3,
    mergeRate: 25.0,
    reposActiveIn: 4,
    lastActiveAt: "2026-03-15T11:20:00Z",
    accountAge: 0.3,
  },
  {
    id: "6",
    username: "code-master-pro",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=master",
    trustScore: 96,
    totalPRs: 412,
    mergedPRs: 389,
    mergeRate: 94.4,
    reposActiveIn: 23,
    lastActiveAt: "2026-03-18T08:45:00Z",
    accountAge: 6.5,
    isWhitelisted: true,
  },
  {
    id: "7",
    username: "spam-account-42",
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=spam42",
    trustScore: 8,
    totalPRs: 892,
    mergedPRs: 4,
    mergeRate: 0.4,
    reposActiveIn: 134,
    lastActiveAt: "2026-03-18T11:02:00Z",
    accountAge: 0.1,
    isBlocked: true,
  },
  {
    id: "8",
    username: "john-maintainer",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    trustScore: 89,
    totalPRs: 178,
    mergedPRs: 145,
    mergeRate: 81.5,
    reposActiveIn: 9,
    lastActiveAt: "2026-03-17T16:40:00Z",
    accountAge: 4.2,
  },
  {
    id: "9",
    username: "ai-code-helper",
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=aihelper",
    trustScore: 34,
    totalPRs: 67,
    mergedPRs: 12,
    mergeRate: 17.9,
    reposActiveIn: 23,
    lastActiveAt: "2026-03-18T07:15:00Z",
    accountAge: 0.5,
  },
  {
    id: "10",
    username: "lisa-security",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa",
    trustScore: 92,
    totalPRs: 156,
    mergedPRs: 138,
    mergeRate: 88.5,
    reposActiveIn: 11,
    lastActiveAt: "2026-03-16T13:25:00Z",
    accountAge: 5.0,
    isWhitelisted: true,
  },
  {
    id: "11",
    username: "quick-pr-bot",
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=quickpr",
    trustScore: 15,
    totalPRs: 423,
    mergedPRs: 19,
    mergeRate: 4.5,
    reposActiveIn: 56,
    lastActiveAt: "2026-03-18T10:30:00Z",
    accountAge: 0.4,
    isBlocked: true,
  },
  {
    id: "12",
    username: "experienced-dev",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=experienced",
    trustScore: 85,
    totalPRs: 234,
    mergedPRs: 189,
    mergeRate: 80.8,
    reposActiveIn: 14,
    lastActiveAt: "2026-03-17T12:10:00Z",
    accountAge: 3.9,
  },
  {
    id: "13",
    username: "docs-contributor",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=docs",
    trustScore: 78,
    totalPRs: 89,
    mergedPRs: 67,
    mergeRate: 75.3,
    reposActiveIn: 6,
    lastActiveAt: "2026-03-15T09:45:00Z",
    accountAge: 2.1,
  },
  {
    id: "14",
    username: "pr-spam-master",
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=spammaster",
    trustScore: 6,
    totalPRs: 1247,
    mergedPRs: 2,
    mergeRate: 0.2,
    reposActiveIn: 189,
    lastActiveAt: "2026-03-18T11:15:00Z",
    accountAge: 0.1,
    isBlocked: true,
  },
  {
    id: "15",
    username: "kate-frontend",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=kate",
    trustScore: 87,
    totalPRs: 167,
    mergedPRs: 139,
    mergeRate: 83.2,
    reposActiveIn: 10,
    lastActiveAt: "2026-03-18T08:20:00Z",
    accountAge: 4.5,
  },
];

export const mockActivity: ActivityEvent[] = [
  {
    id: "1",
    timestamp: "2026-03-18T11:15:00Z",
    contributor: {
      username: "pr-spam-master",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=spammaster",
    },
    repository: {
      name: "frontend-ui",
      owner: "acme-corp",
    },
    prTitle: "Update dependencies to latest versions",
    prNumber: 1523,
    action: "auto_closed",
    trustScore: 6,
  },
  {
    id: "2",
    timestamp: "2026-03-18T10:45:00Z",
    contributor: {
      username: "bot-hunter-9000",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=bot9000",
    },
    repository: {
      name: "api-gateway",
      owner: "acme-corp",
    },
    prTitle: "Fix typo in documentation",
    prNumber: 892,
    action: "auto_closed",
    trustScore: 12,
  },
  {
    id: "3",
    timestamp: "2026-03-18T10:30:00Z",
    contributor: {
      username: "quick-pr-bot",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=quickpr",
    },
    repository: {
      name: "docs",
      owner: "acme-corp",
    },
    prTitle: "Add new examples to README",
    prNumber: 445,
    action: "flagged",
    trustScore: 15,
  },
  {
    id: "4",
    timestamp: "2026-03-18T09:12:00Z",
    contributor: {
      username: "alex-contributor",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    },
    repository: {
      name: "frontend-ui",
      owner: "acme-corp",
    },
    prTitle: "Implement dark mode toggle component",
    prNumber: 1522,
    action: "labeled_trusted",
    trustScore: 88,
  },
  {
    id: "5",
    timestamp: "2026-03-18T08:45:00Z",
    contributor: {
      username: "code-master-pro",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=master",
    },
    repository: {
      name: "api-gateway",
      owner: "acme-corp",
    },
    prTitle: "Optimize database query performance",
    prNumber: 891,
    action: "labeled_trusted",
    trustScore: 96,
  },
  {
    id: "6",
    timestamp: "2026-03-18T08:20:00Z",
    contributor: {
      username: "kate-frontend",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=kate",
    },
    repository: {
      name: "design-system",
      owner: "acme-corp",
    },
    prTitle: "Add new button variants",
    prNumber: 234,
    action: "labeled_trusted",
    trustScore: 87,
  },
  {
    id: "7",
    timestamp: "2026-03-18T07:15:00Z",
    contributor: {
      username: "ai-code-helper",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=aihelper",
    },
    repository: {
      name: "cli-tools",
      owner: "acme-corp",
    },
    prTitle: "Refactor command parser logic",
    prNumber: 156,
    action: "flagged",
    trustScore: 34,
  },
  {
    id: "8",
    timestamp: "2026-03-17T16:40:00Z",
    contributor: {
      username: "john-maintainer",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    },
    repository: {
      name: "database-utils",
      owner: "acme-corp",
    },
    prTitle: "Add connection pooling support",
    prNumber: 89,
    action: "labeled_trusted",
    trustScore: 89,
  },
  {
    id: "9",
    timestamp: "2026-03-17T15:23:00Z",
    contributor: {
      username: "sarah-dev",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    },
    repository: {
      name: "frontend-ui",
      owner: "acme-corp",
    },
    prTitle: "Fix responsive layout issues",
    prNumber: 1521,
    action: "labeled_trusted",
    trustScore: 94,
  },
  {
    id: "10",
    timestamp: "2026-03-17T14:30:00Z",
    contributor: {
      username: "maria-opensource",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
    },
    repository: {
      name: "api-gateway",
      owner: "acme-corp",
    },
    prTitle: "Add rate limiting middleware",
    prNumber: 890,
    action: "labeled_trusted",
    trustScore: 91,
  },
  {
    id: "11",
    timestamp: "2026-03-17T12:10:00Z",
    contributor: {
      username: "experienced-dev",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=experienced",
    },
    repository: {
      name: "design-system",
      owner: "acme-corp",
    },
    prTitle: "Update icon set with new designs",
    prNumber: 233,
    action: "labeled_trusted",
    trustScore: 85,
  },
  {
    id: "12",
    timestamp: "2026-03-16T14:30:00Z",
    contributor: {
      username: "maria-opensource",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
    },
    repository: {
      name: "frontend-ui",
      owner: "acme-corp",
    },
    prTitle: "Implement accessibility improvements",
    prNumber: 1520,
    action: "labeled_trusted",
    trustScore: 91,
  },
  {
    id: "13",
    timestamp: "2026-03-16T13:25:00Z",
    contributor: {
      username: "lisa-security",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa",
    },
    repository: {
      name: "api-gateway",
      owner: "acme-corp",
    },
    prTitle: "Security patch for authentication",
    prNumber: 889,
    action: "whitelisted",
    trustScore: 92,
  },
  {
    id: "14",
    timestamp: "2026-03-15T11:20:00Z",
    contributor: {
      username: "newbie-contributor",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=newbie",
    },
    repository: {
      name: "docs",
      owner: "acme-corp",
    },
    prTitle: "Fix broken links in documentation",
    prNumber: 444,
    action: "flagged",
    trustScore: 45,
  },
  {
    id: "15",
    timestamp: "2026-03-15T09:45:00Z",
    contributor: {
      username: "docs-contributor",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=docs",
    },
    repository: {
      name: "docs",
      owner: "acme-corp",
    },
    prTitle: "Add getting started guide",
    prNumber: 443,
    action: "labeled_trusted",
    trustScore: 78,
  },
  {
    id: "16",
    timestamp: "2026-03-14T16:30:00Z",
    contributor: {
      username: "sarah-dev",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    },
    repository: {
      name: "cli-tools",
      owner: "acme-corp",
    },
    prTitle: "Add progress indicator for long operations",
    prNumber: 155,
    action: "labeled_trusted",
    trustScore: 94,
  },
  {
    id: "17",
    timestamp: "2026-03-14T14:20:00Z",
    contributor: {
      username: "code-master-pro",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=master",
    },
    repository: {
      name: "database-utils",
      owner: "acme-corp",
    },
    prTitle: "Implement transaction retry logic",
    prNumber: 88,
    action: "labeled_trusted",
    trustScore: 96,
  },
  {
    id: "18",
    timestamp: "2026-03-13T11:45:00Z",
    contributor: {
      username: "alex-contributor",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    },
    repository: {
      name: "frontend-ui",
      owner: "acme-corp",
    },
    prTitle: "Refactor state management",
    prNumber: 1519,
    action: "labeled_trusted",
    trustScore: 88,
  },
  {
    id: "19",
    timestamp: "2026-03-12T10:15:00Z",
    contributor: {
      username: "quick-pr-bot",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=quickpr",
    },
    repository: {
      name: "frontend-ui",
      owner: "acme-corp",
    },
    prTitle: "Update all package versions",
    prNumber: 1518,
    action: "auto_closed",
    trustScore: 15,
  },
  {
    id: "20",
    timestamp: "2026-03-11T15:30:00Z",
    contributor: {
      username: "kate-frontend",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=kate",
    },
    repository: {
      name: "design-system",
      owner: "acme-corp",
    },
    prTitle: "Add animation utilities",
    prNumber: 232,
    action: "labeled_trusted",
    trustScore: 87,
  },
];

// Chart data for dashboard
export const mockPRVolumeData: ChartDataPoint[] = [
  { date: "Mar 11", value: 42 },
  { date: "Mar 12", value: 38 },
  { date: "Mar 13", value: 51 },
  { date: "Mar 14", value: 47 },
  { date: "Mar 15", value: 63 },
  { date: "Mar 16", value: 58 },
  { date: "Mar 17", value: 71 },
  { date: "Mar 18", value: 89 },
];

export const mockTrustScoreDistribution: ChartDataPoint[] = [
  { date: "0-20", value: 87, label: "Very Low" },
  { date: "21-40", value: 34, label: "Low" },
  { date: "41-60", value: 56, label: "Medium" },
  { date: "61-80", value: 142, label: "High" },
  { date: "81-100", value: 201, label: "Very High" },
];

export const mockSpamRateTrend: ChartDataPoint[] = [
  { date: "Mar 11", value: 15.2 },
  { date: "Mar 12", value: 18.4 },
  { date: "Mar 13", value: 14.1 },
  { date: "Mar 14", value: 12.8 },
  { date: "Mar 15", value: 16.9 },
  { date: "Mar 16", value: 13.5 },
  { date: "Mar 17", value: 11.7 },
  { date: "Mar 18", value: 10.3 },
];
