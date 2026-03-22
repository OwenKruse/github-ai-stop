import { db } from "@/lib/db";
import {
  repositories,
  contributors,
  activityEvents,
} from "@/lib/db/schema";
import { desc, eq, sql, count, avg, and, gte, like } from "drizzle-orm";

// ---------- Repositories ----------

export async function getRepositories() {
  const repos = await db.select().from(repositories).orderBy(desc(repositories.createdAt));

  const withStats = await Promise.all(
    repos.map(async (repo) => {
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const [prStats] = await db
        .select({
          total: count(),
          spamCount: sql<number>`sum(case when ${activityEvents.action} in ('flagged','auto_closed') then 1 else 0 end)`,
        })
        .from(activityEvents)
        .where(
          and(
            eq(activityEvents.repositoryId, repo.id),
            gte(activityEvents.timestamp, thirtyDaysAgo)
          )
        );

      const prsThisMonth = prStats?.total ?? 0;
      const spamCount = prStats?.spamCount ?? 0;
      const spamRate = prsThisMonth > 0 ? (spamCount / prsThisMonth) * 100 : 0;

      return {
        ...repo,
        id: String(repo.id),
        prsThisMonth,
        spamRate: Math.round(spamRate * 10) / 10,
      };
    })
  );

  return withStats;
}

export async function getRepositoryById(id: number) {
  const [repo] = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, id));
  return repo ?? null;
}

// ---------- Contributors ----------

export async function getContributors() {
  const rows = await db.select().from(contributors).orderBy(desc(contributors.trustScore));

  return rows.map((c) => {
    const mergeRate = c.totalPRs > 0 ? (c.mergedPRs / c.totalPRs) * 100 : 0;
    return {
      ...c,
      id: String(c.id),
      mergeRate: Math.round(mergeRate * 10) / 10,
      reposActiveIn: 0,
    };
  });
}

export async function getContributorsWithRepoCount() {
  const rows = await db.select().from(contributors).orderBy(desc(contributors.trustScore));

  const withCounts = await Promise.all(
    rows.map(async (c) => {
      const [repoCount] = await db
        .select({
          count: sql<number>`count(distinct ${activityEvents.repositoryId})`,
        })
        .from(activityEvents)
        .where(eq(activityEvents.contributorId, c.id));

      const mergeRate = c.totalPRs > 0 ? (c.mergedPRs / c.totalPRs) * 100 : 0;

      return {
        ...c,
        id: String(c.id),
        mergeRate: Math.round(mergeRate * 10) / 10,
        reposActiveIn: repoCount?.count ?? 0,
      };
    })
  );

  return withCounts;
}

// ---------- Activity Events ----------

export async function getActivityEvents(limit = 50) {
  const events = await db
    .select()
    .from(activityEvents)
    .orderBy(desc(activityEvents.timestamp))
    .limit(limit);

  const withJoins = await Promise.all(
    events.map(async (event) => {
      const [contributor] = await db
        .select()
        .from(contributors)
        .where(eq(contributors.id, event.contributorId));
      const [repo] = await db
        .select()
        .from(repositories)
        .where(eq(repositories.id, event.repositoryId));

      return {
        id: String(event.id),
        timestamp: event.timestamp,
        contributor: {
          username: contributor?.username ?? "unknown",
          avatarUrl: contributor?.avatarUrl ?? "",
        },
        repository: {
          name: repo?.name ?? "unknown",
          owner: repo?.owner ?? "unknown",
        },
        prTitle: event.prTitle,
        prNumber: event.prNumber,
        action: event.action,
        trustScore: event.trustScoreAtTime,
      };
    })
  );

  return withJoins;
}

export async function getActivityForRepo(repoId: number, limit = 10) {
  const events = await db
    .select()
    .from(activityEvents)
    .where(eq(activityEvents.repositoryId, repoId))
    .orderBy(desc(activityEvents.timestamp))
    .limit(limit);

  const withJoins = await Promise.all(
    events.map(async (event) => {
      const [contributor] = await db
        .select()
        .from(contributors)
        .where(eq(contributors.id, event.contributorId));

      return {
        id: String(event.id),
        timestamp: event.timestamp,
        contributor: {
          username: contributor?.username ?? "unknown",
          avatarUrl: contributor?.avatarUrl ?? "",
        },
        prTitle: event.prTitle,
        prNumber: event.prNumber,
        action: event.action,
        trustScore: event.trustScoreAtTime,
      };
    })
  );

  return withJoins;
}

// ---------- Dashboard Stats ----------

export async function getDashboardStats() {
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [prStats] = await db
    .select({
      total: count(),
      spamCount: sql<number>`sum(case when ${activityEvents.action} in ('auto_closed') then 1 else 0 end)`,
    })
    .from(activityEvents)
    .where(gte(activityEvents.timestamp, sevenDaysAgo));

  const [scoreStats] = await db
    .select({ avg: avg(contributors.trustScore) })
    .from(contributors);

  const [repoStats] = await db
    .select({ count: count() })
    .from(repositories)
    .where(eq(repositories.status, "active"));

  return {
    prsThisWeek: prStats?.total ?? 0,
    spamBlocked: prStats?.spamCount ?? 0,
    avgTrustScore: Math.round((Number(scoreStats?.avg) || 0) * 10) / 10,
    activeRepos: repoStats?.count ?? 0,
  };
}

export async function getPRVolumeData(days = 8) {
  const results: { date: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dayStr = day.toISOString().slice(0, 10);
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const [row] = await db
      .select({ count: count() })
      .from(activityEvents)
      .where(
        and(
          gte(activityEvents.timestamp, dayStr),
          sql`${activityEvents.timestamp} < ${nextDay}`
        )
      );

    results.push({
      date: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: row?.count ?? 0,
    });
  }
  return results;
}

export async function getSpamRateTrend(days = 8) {
  const results: { date: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dayStr = day.toISOString().slice(0, 10);
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const [row] = await db
      .select({
        total: count(),
        spam: sql<number>`sum(case when ${activityEvents.action} in ('flagged','auto_closed') then 1 else 0 end)`,
      })
      .from(activityEvents)
      .where(
        and(
          gte(activityEvents.timestamp, dayStr),
          sql`${activityEvents.timestamp} < ${nextDay}`
        )
      );

    const total = row?.total ?? 0;
    const spam = row?.spam ?? 0;
    const rate = total > 0 ? (spam / total) * 100 : 0;

    results.push({
      date: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(rate * 10) / 10,
    });
  }
  return results;
}

export async function getTrustScoreDistribution() {
  const ranges = [
    { date: "0-20", min: 0, max: 20, label: "Very Low" },
    { date: "21-40", min: 21, max: 40, label: "Low" },
    { date: "41-60", min: 41, max: 60, label: "Medium" },
    { date: "61-80", min: 61, max: 80, label: "High" },
    { date: "81-100", min: 81, max: 100, label: "Very High" },
  ];

  const results = await Promise.all(
    ranges.map(async (range) => {
      const [row] = await db
        .select({ count: count() })
        .from(contributors)
        .where(
          and(
            gte(contributors.trustScore, range.min),
            sql`${contributors.trustScore} <= ${range.max}`
          )
        );
      return { date: range.date, value: row?.count ?? 0, label: range.label };
    })
  );

  return results;
}

export async function searchContributors(query: string) {
  const rows = await db
    .select()
    .from(contributors)
    .where(
      and(
        like(contributors.username, `%${query}%`),
        eq(contributors.isWhitelisted, false)
      )
    )
    .orderBy(desc(contributors.trustScore))
    .limit(10);

  return rows.map((c) => ({
    ...c,
    id: String(c.id),
    mergeRate: c.totalPRs > 0
      ? Math.round(((c.mergedPRs / c.totalPRs) * 100) * 10) / 10
      : 0,
  }));
}

// ---------- Platform Stats (landing page) ----------

export async function getPlatformStats() {
  const [eventStats] = await db
    .select({
      totalEvents: count(),
      spamBlocked: sql<number>`sum(case when ${activityEvents.action} in ('flagged','auto_closed') then 1 else 0 end)`,
    })
    .from(activityEvents);

  const [repoStats] = await db
    .select({ count: count() })
    .from(repositories);

  const [contributorStats] = await db
    .select({ count: count() })
    .from(contributors);

  return {
    totalPRs: eventStats?.totalEvents ?? 0,
    spamBlocked: eventStats?.spamBlocked ?? 0,
    totalRepos: repoStats?.count ?? 0,
    totalContributors: contributorStats?.count ?? 0,
  };
}

export async function getWhitelistedContributors() {
  const rows = await db
    .select()
    .from(contributors)
    .where(eq(contributors.isWhitelisted, true))
    .orderBy(desc(contributors.trustScore));

  return rows.map((c) => ({
    ...c,
    id: String(c.id),
    mergeRate: c.totalPRs > 0
      ? Math.round(((c.mergedPRs / c.totalPRs) * 100) * 10) / 10
      : 0,
  }));
}
