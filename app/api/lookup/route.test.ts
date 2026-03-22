import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => {
  const selectReturn = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  };
  return {
    db: {
      select: vi.fn(() => selectReturn),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      })),
    },
  };
});

const mockFetchStats = vi.fn();
vi.mock("@/lib/github/fetch-contributor-stats", () => ({
  fetchGitHubContributorStats: (...args: unknown[]) => mockFetchStats(...args),
}));

vi.mock("@/lib/db/schema", () => ({
  contributors: { id: "id", username: "username" },
  activityEvents: {
    contributorId: "contributor_id",
    repositoryId: "repository_id",
    timestamp: "timestamp",
  },
}));

import { GET } from "./route";
import { db } from "@/lib/db";

function makeRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

const MOCK_GH_STATS = {
  username: "octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231",
  accountAgeYears: 5.2,
  totalPRs: 120,
  mergedPRs: 90,
  mergeRate: 75,
  reposActiveIn: 25,
  bio: "GitHub mascot",
  publicRepos: 30,
  followers: 5000,
};

describe("GET /api/lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when username is missing", async () => {
    const res = await GET(makeRequest("/api/lookup"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/username/i);
  });

  it("returns 400 when username is empty string", async () => {
    const res = await GET(makeRequest("/api/lookup?username=  "));
    expect(res.status).toBe(400);
  });

  it("returns 404 when user is not in DB and GitHub returns null", async () => {
    mockFetchStats.mockResolvedValue(null);
    const selectReturn = { from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) };
    vi.mocked(db.select).mockReturnValue(selectReturn as never);

    const res = await GET(makeRequest("/api/lookup?username=nonexistent"));
    expect(res.status).toBe(404);
  });

  it("returns real GitHub stats for untracked users (source=github)", async () => {
    mockFetchStats.mockResolvedValue(MOCK_GH_STATS);
    const selectReturn = { from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) };
    vi.mocked(db.select).mockReturnValue(selectReturn as never);

    const res = await GET(makeRequest("/api/lookup?username=octocat"));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.source).toBe("github");
    expect(body.totalPRs).toBe(120);
    expect(body.mergedPRs).toBe(90);
    expect(body.reposActiveIn).toBe(25);
    expect(body.trustScore).toBeGreaterThan(0);
    expect(body.trustScore).toBeLessThanOrEqual(100);
    expect(mockFetchStats).toHaveBeenCalledWith("octocat");
  });

  it("computes score with real inputs for untracked users (not all zeros)", async () => {
    mockFetchStats.mockResolvedValue(MOCK_GH_STATS);
    const selectReturn = { from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) };
    vi.mocked(db.select).mockReturnValue(selectReturn as never);

    const res = await GET(makeRequest("/api/lookup?username=octocat"));
    const body = await res.json();

    // With 120 total, 90 merged, 5.2yr age, 25 repos, the score should be
    // well above what an account-age-only score would produce (~25 for 0 PRs)
    expect(body.trustScore).toBeGreaterThan(40);
  });
});
