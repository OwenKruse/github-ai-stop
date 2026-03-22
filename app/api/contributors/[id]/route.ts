import { NextRequest, NextResponse } from "next/server";
import { eq, sql, and, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { contributors, activityEvents } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { computeTrustScore } from "@/lib/scoring";
import { fetchGitHubContributorStats } from "@/lib/github/fetch-contributor-stats";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const contributorId = parseInt(id, 10);
  if (isNaN(contributorId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  let needsScoreRecalc = false;

  if (typeof body.isWhitelisted === "boolean") {
    update.isWhitelisted = body.isWhitelisted;
    if (body.isWhitelisted) {
      update.trustScore = 100;
      update.isBlocked = false;
    } else {
      needsScoreRecalc = true;
    }
  }

  if (typeof body.isBlocked === "boolean") {
    update.isBlocked = body.isBlocked;
    if (body.isBlocked) {
      update.trustScore = 0;
      update.isWhitelisted = false;
    } else {
      needsScoreRecalc = true;
    }
  }

  const [updated] = await db
    .update(contributors)
    .set(update)
    .where(eq(contributors.id, contributorId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Contributor not found" }, { status: 404 });
  }

  if (needsScoreRecalc && !updated.isWhitelisted && !updated.isBlocked) {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const [[repoCount], [recentEvents]] = await Promise.all([
      db
        .select({
          count: sql<number>`count(distinct ${activityEvents.repositoryId})`,
        })
        .from(activityEvents)
        .where(eq(activityEvents.contributorId, contributorId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(activityEvents)
        .where(
          and(
            eq(activityEvents.contributorId, contributorId),
            gte(activityEvents.timestamp, twentyFourHoursAgo)
          )
        ),
    ]);

    let totalPRs = updated.totalPRs;
    let mergedPRs = updated.mergedPRs;
    let reposActiveIn = repoCount?.count ?? 0;

    const ghStats = await fetchGitHubContributorStats(updated.username).catch(
      () => null
    );
    if (ghStats) {
      totalPRs = Math.max(totalPRs, ghStats.totalPRs);
      mergedPRs = Math.max(mergedPRs, ghStats.mergedPRs);
      reposActiveIn = Math.max(reposActiveIn, ghStats.reposActiveIn);
    }

    const trustScore = computeTrustScore({
      totalPRs,
      mergedPRs,
      accountAgeYears: updated.accountAge,
      reposActiveIn,
      recentEventCount: recentEvents?.count ?? 0,
      isWhitelisted: false,
      isBlocked: false,
    });

    const [recalced] = await db
      .update(contributors)
      .set({ trustScore, updatedAt: new Date().toISOString() })
      .where(eq(contributors.id, contributorId))
      .returning();

    return NextResponse.json(recalced);
  }

  return NextResponse.json(updated);
}
