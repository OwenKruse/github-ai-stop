const GH_API = "https://api.github.com";
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface GitHubContributorStats {
  username: string;
  avatarUrl: string;
  accountAgeYears: number;
  totalPRs: number;
  mergedPRs: number;
  mergeRate: number;
  reposActiveIn: number;
  bio: string | null;
  publicRepos: number;
  followers: number;
}

interface CacheEntry {
  data: GitHubContributorStats;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  const token = process.env.GITHUB_PAT;
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }
  return h;
}

async function searchPRCount(query: string): Promise<number> {
  const url = `${GH_API}/search/issues?q=${encodeURIComponent(query)}&per_page=1`;
  const res = await fetch(url, { headers: ghHeaders(), cache: "no-store" });
  if (!res.ok) return 0;
  const json = await res.json();
  return json.total_count ?? 0;
}

/**
 * Fetches cross-repo PR stats for any GitHub user via the Search API.
 * Results are cached in-memory for 5 minutes per username.
 * Returns null if the user doesn't exist.
 */
export async function fetchGitHubContributorStats(
  username: string
): Promise<GitHubContributorStats | null> {
  const key = username.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const headers = ghHeaders();

  const userRes = await fetch(`${GH_API}/users/${username}`, {
    headers,
    cache: "no-store",
  });
  if (!userRes.ok) return null;
  const ghUser = await userRes.json();

  const createdAt = new Date(ghUser.created_at);
  const accountAgeYears =
    (Date.now() - createdAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  // Fetch total PRs (with per_page=100 to count distinct repos from first page)
  // and merged PR count in parallel
  const prSearchUrl = `${GH_API}/search/issues?q=${encodeURIComponent(
    `type:pr author:${username}`
  )}&per_page=100&sort=updated`;

  const [prSearchRes, mergedPRs] = await Promise.all([
    fetch(prSearchUrl, { headers, cache: "no-store" }),
    searchPRCount(`type:pr author:${username} is:merged`),
  ]);

  let totalPRs = 0;
  let estimatedRepos = ghUser.public_repos ?? 0;

  if (prSearchRes.ok) {
    const prSearchJson = await prSearchRes.json();
    totalPRs = prSearchJson.total_count ?? 0;
    const items: { repository_url?: string }[] = prSearchJson.items ?? [];
    const uniqueRepos = new Set(
      items.map((i) => i.repository_url).filter(Boolean)
    );
    if (uniqueRepos.size > 0) {
      estimatedRepos = uniqueRepos.size;
    }
  }

  const mergeRate =
    totalPRs > 0 ? Math.round(((mergedPRs / totalPRs) * 100) * 10) / 10 : 0;

  const data: GitHubContributorStats = {
    username: ghUser.login,
    avatarUrl: ghUser.avatar_url,
    accountAgeYears: Math.round(accountAgeYears * 10) / 10,
    totalPRs,
    mergedPRs,
    mergeRate,
    reposActiveIn: estimatedRepos,
    bio: ghUser.bio ?? null,
    publicRepos: ghUser.public_repos ?? 0,
    followers: ghUser.followers ?? 0,
  };

  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });

  return data;
}
