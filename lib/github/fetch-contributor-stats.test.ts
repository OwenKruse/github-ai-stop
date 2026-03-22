import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to clear the module-level cache between tests, so we dynamically
// import the module after resetting mocks each time.
let fetchGitHubContributorStats: typeof import("./fetch-contributor-stats").fetchGitHubContributorStats;

const MOCK_GH_USER = {
  login: "testuser",
  avatar_url: "https://avatars.githubusercontent.com/u/1",
  created_at: new Date(Date.now() - 3 * 365.25 * 24 * 60 * 60 * 1000).toISOString(),
  bio: "A test user",
  public_repos: 15,
  followers: 42,
};

const MOCK_PR_SEARCH_RESPONSE = {
  total_count: 80,
  items: Array.from({ length: 10 }, (_, i) => ({
    repository_url: `https://api.github.com/repos/org/repo-${i}`,
  })),
};

const MOCK_MERGED_SEARCH_RESPONSE = {
  total_count: 60,
  items: [],
};

function mockFetchResponses(overrides?: {
  userStatus?: number;
  prSearchStatus?: number;
  mergedSearchStatus?: number;
}) {
  const { userStatus = 200, prSearchStatus = 200, mergedSearchStatus = 200 } =
    overrides ?? {};

  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === "string" ? url : url.toString();

    if (urlStr.includes("/users/")) {
      return {
        ok: userStatus === 200,
        status: userStatus,
        json: async () => (userStatus === 200 ? MOCK_GH_USER : {}),
      } as Response;
    }

    if (urlStr.includes("is%3Amerged") || urlStr.includes("is:merged")) {
      return {
        ok: mergedSearchStatus === 200,
        status: mergedSearchStatus,
        json: async () =>
          mergedSearchStatus === 200 ? MOCK_MERGED_SEARCH_RESPONSE : {},
      } as Response;
    }

    if (urlStr.includes("/search/issues")) {
      return {
        ok: prSearchStatus === 200,
        status: prSearchStatus,
        json: async () =>
          prSearchStatus === 200 ? MOCK_PR_SEARCH_RESPONSE : {},
      } as Response;
    }

    return { ok: false, status: 404, json: async () => ({}) } as Response;
  });
}

describe("fetchGitHubContributorStats", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", mockFetchResponses());
    const mod = await import("./fetch-contributor-stats");
    fetchGitHubContributorStats = mod.fetchGitHubContributorStats;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null for a 404 user", async () => {
    vi.stubGlobal("fetch", mockFetchResponses({ userStatus: 404 }));
    const mod = await import("./fetch-contributor-stats");
    const result = await mod.fetchGitHubContributorStats("nonexistent");
    expect(result).toBeNull();
  });

  it("parses GitHub user profile and search results correctly", async () => {
    const result = await fetchGitHubContributorStats("testuser");
    expect(result).not.toBeNull();
    expect(result!.username).toBe("testuser");
    expect(result!.avatarUrl).toBe(MOCK_GH_USER.avatar_url);
    expect(result!.totalPRs).toBe(80);
    expect(result!.mergedPRs).toBe(60);
    expect(result!.mergeRate).toBe(75);
    expect(result!.reposActiveIn).toBe(10);
    expect(result!.bio).toBe("A test user");
    expect(result!.publicRepos).toBe(15);
    expect(result!.followers).toBe(42);
    expect(result!.accountAgeYears).toBeCloseTo(3, 0);
  });

  it("returns cached data on second call without re-fetching", async () => {
    const mockFetch = mockFetchResponses();
    vi.stubGlobal("fetch", mockFetch);
    const mod = await import("./fetch-contributor-stats");

    await mod.fetchGitHubContributorStats("cacheduser");
    const callCountAfterFirst = mockFetch.mock.calls.length;

    await mod.fetchGitHubContributorStats("cacheduser");
    expect(mockFetch.mock.calls.length).toBe(callCountAfterFirst);
  });

  it("cache is case-insensitive", async () => {
    const mockFetch = mockFetchResponses();
    vi.stubGlobal("fetch", mockFetch);
    const mod = await import("./fetch-contributor-stats");

    await mod.fetchGitHubContributorStats("CasedUser");
    const callCountAfterFirst = mockFetch.mock.calls.length;

    await mod.fetchGitHubContributorStats("caseduser");
    expect(mockFetch.mock.calls.length).toBe(callCountAfterFirst);
  });

  it("handles search API failure gracefully (returns 0 for PR counts)", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchResponses({ prSearchStatus: 403, mergedSearchStatus: 403 })
    );
    const mod = await import("./fetch-contributor-stats");
    const result = await mod.fetchGitHubContributorStats("ratelimited");
    expect(result).not.toBeNull();
    expect(result!.totalPRs).toBe(0);
    expect(result!.mergedPRs).toBe(0);
    expect(result!.mergeRate).toBe(0);
    // Falls back to public_repos for repo count
    expect(result!.reposActiveIn).toBe(MOCK_GH_USER.public_repos);
  });
});
