import { NextResponse } from "next/server";
import { eq, sql, and, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { contributors, activityEvents } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { computeTrustScore } from "@/lib/scoring";
import { fetchGitHubContributorStats } from "@/lib/github/fetch-contributor-stats";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allContributors = await db.select().from(contributors);

  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  let updated = 0;

  for (const contributor of allContributors) {
    if (contributor.isWhitelisted || contributor.isBlocked) continue;

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

    const ghStats = await fetchGitHubContributorStats(
      contributor.username
    ).catch(() => null);
    if (ghStats) {
      totalPRs = Math.max(totalPRs, ghStats.totalPRs);
      mergedPRs = Math.max(mergedPRs, ghStats.mergedPRs);
      reposActiveIn = Math.max(reposActiveIn, ghStats.reposActiveIn);
    }

    const trustScore = computeTrustScore({
      totalPRs,
      mergedPRs,
      accountAgeYears: contributor.accountAge,
      reposActiveIn,
      recentEventCount: recentEvents?.count ?? 0,
      isWhitelisted: false,
      isBlocked: false,
    });

    if (trustScore !== contributor.trustScore) {
      await db
        .update(contributors)
        .set({ trustScore, updatedAt: new Date().toISOString() })
        .where(eq(contributors.id, contributor.id));
      updated++;
    }
  }

  return NextResponse.json({ refreshed: allContributors.length, updated });
}
