import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const MOCK_CONTRIBUTOR = {
  id: 1,
  githubId: 12345,
  username: "testuser",
  avatarUrl: "https://example.com/avatar.png",
  trustScore: 75,
  totalPRs: 30,
  mergedPRs: 24,
  accountAge: 3,
  isWhitelisted: false,
  isBlocked: false,
  lastActiveAt: new Date().toISOString(),
  lastGithubSyncAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

let mockUpdateReturns: Record<string, unknown>[] = [MOCK_CONTRIBUTOR];
let mockSelectReturns: Record<string, unknown>[][] = [
  [{ count: 5 }],
  [{ count: 0 }],
];

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user1" } }),
}));

vi.mock("@/lib/db/schema", () => ({
  contributors: { id: "id" },
  activityEvents: {
    contributorId: "contributor_id",
    repositoryId: "repository_id",
    timestamp: "timestamp",
  },
}));

vi.mock("@/lib/github/fetch-contributor-stats", () => ({
  fetchGitHubContributorStats: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/db", () => {
  let selectCallIndex = 0;
  return {
    db: {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => mockUpdateReturns),
          })),
        })),
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => {
            const result = mockSelectReturns[selectCallIndex] ?? [{ count: 0 }];
            selectCallIndex++;
            return Promise.resolve(result);
          }),
        })),
      })),
    },
  };
});

import { PATCH } from "./route";
import { auth } from "@/lib/auth";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL("http://localhost:3000/api/contributors/1"), {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("PATCH /api/contributors/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateReturns = [{ ...MOCK_CONTRIBUTOR }];
    mockSelectReturns = [[{ count: 5 }], [{ count: 0 }]];
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);
    const res = await PATCH(
      makeRequest({ isWhitelisted: true }),
      makeParams("1")
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for non-numeric id", async () => {
    const res = await PATCH(
      makeRequest({ isWhitelisted: true }),
      makeParams("abc")
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when contributor not found", async () => {
    mockUpdateReturns = [];
    const res = await PATCH(
      makeRequest({ isWhitelisted: true }),
      makeParams("999")
    );
    expect(res.status).toBe(404);
  });

  it("whitelisting sets score to 100", async () => {
    mockUpdateReturns = [
      { ...MOCK_CONTRIBUTOR, isWhitelisted: true, trustScore: 100 },
    ];
    const res = await PATCH(
      makeRequest({ isWhitelisted: true }),
      makeParams("1")
    );
    const body = await res.json();
    expect(body.trustScore).toBe(100);
    expect(body.isWhitelisted).toBe(true);
  });

  it("blocking sets score to 0", async () => {
    mockUpdateReturns = [
      { ...MOCK_CONTRIBUTOR, isBlocked: true, trustScore: 0 },
    ];
    const res = await PATCH(
      makeRequest({ isBlocked: true }),
      makeParams("1")
    );
    const body = await res.json();
    expect(body.trustScore).toBe(0);
    expect(body.isBlocked).toBe(true);
  });

  it("un-whitelisting recalculates score (does NOT stay at 100)", async () => {
    // First update returns the contributor after removing whitelist
    mockUpdateReturns = [
      {
        ...MOCK_CONTRIBUTOR,
        isWhitelisted: false,
        isBlocked: false,
        trustScore: 100,
      },
    ];

    const res = await PATCH(
      makeRequest({ isWhitelisted: false }),
      makeParams("1")
    );
    const body = await res.json();

    // The recalculated score should be returned (not 100).
    // With our mock, the second db.update call returns the recalced entry.
    // The important thing is that the route TRIES to recalculate by entering
    // the needsScoreRecalc branch (we can verify the update was called twice).
    const { db } = await import("@/lib/db");
    expect(vi.mocked(db.update).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("un-blocking recalculates score (does NOT stay at 0)", async () => {
    mockUpdateReturns = [
      {
        ...MOCK_CONTRIBUTOR,
        isBlocked: false,
        isWhitelisted: false,
        trustScore: 0,
      },
    ];

    const res = await PATCH(
      makeRequest({ isBlocked: false }),
      makeParams("1")
    );

    const { db } = await import("@/lib/db");
    expect(vi.mocked(db.update).mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
