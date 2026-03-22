import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contributors, activityEvents } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { computeTrustScore } from "@/lib/scoring";
import { fetchGitHubContributorStats } from "@/lib/github/fetch-contributor-stats";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.trim();

  if (!username) {
    return NextResponse.json(
      { error: "username query parameter is required" },
      { status: 400 }
    );
  }

  const [contributor] = await db
    .select()
    .from(contributors)
    .where(eq(contributors.username, username));

  if (contributor) {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const [[repoCount], [recentEvents]] = await Promise.all([
      db
        .select({
          count: sql<number>`count(distinct ${activityEvents.repositoryId})`,
        })
        .from(activityEvents)
        .where(eq(activityEvents.contributorId, contributor.id)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(activityEvents)
        .where(
          and(
            eq(activityEvents.contributorId, contributor.id),
            gte(activityEvents.timestamp, twentyFourHoursAgo)
          )
        ),
    ]);

    let totalPRs = contributor.totalPRs;
    let mergedPRs = contributor.mergedPRs;
    let reposActiveIn = repoCount?.count ?? 0;
    let bio: string | undefined;
    let publicRepos: number | undefined;
    let followers: number | undefined;

    const ghStats = await fetchGitHubContributorStats(username);
    if (ghStats) {
      totalPRs = Math.max(totalPRs, ghStats.totalPRs);
      mergedPRs = Math.max(mergedPRs, ghStats.mergedPRs);
      reposActiveIn = Math.max(reposActiveIn, ghStats.reposActiveIn);
      bio = ghStats.bio ?? undefined;
      publicRepos = ghStats.publicRepos;
      followers = ghStats.followers;
    }

    const mergeRate =
      totalPRs > 0
        ? Math.round(((mergedPRs / totalPRs) * 100) * 10) / 10
        : 0;

    const trustScore = computeTrustScore({
      totalPRs,
      mergedPRs,
      accountAgeYears: contributor.accountAge,
      reposActiveIn,
      recentEventCount: recentEvents?.count ?? 0,
      isWhitelisted: contributor.isWhitelisted,
      isBlocked: contributor.isBlocked,
    });

    if (trustScore !== contributor.trustScore) {
      await db
        .update(contributors)
        .set({ trustScore, updatedAt: new Date().toISOString() })
        .where(eq(contributors.id, contributor.id));
    }

    return NextResponse.json({
      source: "tracked",
      username: contributor.username,
      avatarUrl: contributor.avatarUrl,
      trustScore,
      totalPRs,
      mergedPRs,
      mergeRate,
      accountAgeYears: contributor.accountAge,
      reposActiveIn,
      recentEventCount: recentEvents?.count ?? 0,
      isWhitelisted: contributor.isWhitelisted,
      isBlocked: contributor.isBlocked,
      lastActiveAt: contributor.lastActiveAt,
      bio,
      publicRepos,
      followers,
    });
  }

  const ghStats = await fetchGitHubContributorStats(username);

  if (!ghStats) {
    return NextResponse.json(
      { error: "GitHub user not found" },
      { status: 404 }
    );
  }

  const trustScore = computeTrustScore({
    totalPRs: ghStats.totalPRs,
    mergedPRs: ghStats.mergedPRs,
    accountAgeYears: ghStats.accountAgeYears,
    reposActiveIn: ghStats.reposActiveIn,
    recentEventCount: 0,
    isWhitelisted: false,
    isBlocked: false,
  });

  return NextResponse.json({
    source: "github",
    username: ghStats.username,
    avatarUrl: ghStats.avatarUrl,
    trustScore,
    totalPRs: ghStats.totalPRs,
    mergedPRs: ghStats.mergedPRs,
    mergeRate: ghStats.mergeRate,
    accountAgeYears: ghStats.accountAgeYears,
    reposActiveIn: ghStats.reposActiveIn,
    recentEventCount: 0,
    isWhitelisted: false,
    isBlocked: false,
    lastActiveAt: null,
    bio: ghStats.bio,
    publicRepos: ghStats.publicRepos,
    followers: ghStats.followers,
  });
}
