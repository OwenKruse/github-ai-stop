import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq, sql, and, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { repositories, contributors, activityEvents } from "@/lib/db/schema";
import { computeTrustScore } from "@/lib/scoring";
import { enforce } from "@/lib/github/enforce";
import { fetchGitHubContributorStats } from "@/lib/github/fetch-contributor-stats";

async function verifySignature(
  body: string,
  signature: string | null
): Promise<boolean> {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(body).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");

  if (!(await verifySignature(body, signature))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const action = payload.action as string;

  if (event === "installation" || event === "installation_repositories") {
    return handleInstallationEvent(payload, action);
  }

  if (event !== "pull_request") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (!["opened", "closed", "reopened"].includes(action)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const pr = payload.pull_request;
  const repo = payload.repository;
  const sender = payload.sender;
  const installationId = payload.installation?.id as number | undefined;

  // --- Upsert repository ---
  const [dbRepo] = await db
    .insert(repositories)
    .values({
      githubId: repo.id,
      name: repo.name,
      owner: repo.owner.login,
      fullName: repo.full_name,
      installedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: repositories.githubId,
      set: {
        name: repo.name,
        owner: repo.owner.login,
        fullName: repo.full_name,
        updatedAt: new Date().toISOString(),
      },
    })
    .returning();

  // --- Upsert contributor ---
  const accountCreated = new Date(sender.created_at ?? Date.now());
  const accountAgeYears =
    (Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  const isMerged = action === "closed" && pr.merged === true;
  const isClosed = action === "closed" && pr.merged !== true;

  const [dbContributor] = await db
    .insert(contributors)
    .values({
      githubId: sender.id,
      username: sender.login,
      avatarUrl: sender.avatar_url,
      accountAge: accountAgeYears,
      totalPRs: 1,
      mergedPRs: isMerged ? 1 : 0,
      lastActiveAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: contributors.githubId,
      set: {
        username: sender.login,
        avatarUrl: sender.avatar_url,
        accountAge: accountAgeYears,
        totalPRs:
          action === "opened"
            ? sql`${contributors.totalPRs} + 1`
            : contributors.totalPRs,
        mergedPRs: isMerged
          ? sql`${contributors.mergedPRs} + 1`
          : contributors.mergedPRs,
        lastActiveAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
    .returning();

  // --- Auto-whitelist repo owners ---
  const isRepoOwner =
    repo.owner.type === "User" && sender.login === repo.owner.login;

  if (isRepoOwner && !dbContributor.isWhitelisted) {
    await db
      .update(contributors)
      .set({
        isWhitelisted: true,
        trustScore: 100,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(contributors.id, dbContributor.id));
    dbContributor.isWhitelisted = true;
  }

  // --- Compute trust score (enriched with GitHub-wide data) ---
  const reposActiveIn = await db
    .select({ count: sql<number>`count(distinct ${activityEvents.repositoryId})` })
    .from(activityEvents)
    .where(eq(activityEvents.contributorId, dbContributor.id));

  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const recentEvents = await db
    .select({ count: sql<number>`count(*)` })
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.contributorId, dbContributor.id),
        gte(activityEvents.timestamp, twentyFourHoursAgo)
      )
    );

  let totalPRs = dbContributor.totalPRs;
  let mergedPRs = dbContributor.mergedPRs;
  let crossRepoCount = reposActiveIn[0]?.count ?? 0;

  const ghStats = await fetchGitHubContributorStats(sender.login).catch(
    () => null
  );
  if (ghStats) {
    totalPRs = Math.max(totalPRs, ghStats.totalPRs);
    mergedPRs = Math.max(mergedPRs, ghStats.mergedPRs);
    crossRepoCount = Math.max(crossRepoCount, ghStats.reposActiveIn);
  }

  const trustScore = computeTrustScore({
    totalPRs,
    mergedPRs,
    accountAgeYears: dbContributor.accountAge,
    reposActiveIn: crossRepoCount,
    recentEventCount: recentEvents[0]?.count ?? 0,
    isWhitelisted: dbContributor.isWhitelisted,
    isBlocked: dbContributor.isBlocked,
  });

  await db
    .update(contributors)
    .set({
      trustScore,
      lastGithubSyncAt: ghStats ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(contributors.id, dbContributor.id));

  // --- Determine action ---
  let eventAction: "labeled_trusted" | "flagged" | "auto_closed";
  if (trustScore >= dbRepo.trustThreshold) {
    eventAction = "labeled_trusted";
  } else if (dbRepo.autoClose && trustScore < dbRepo.trustThreshold * 0.5) {
    eventAction = "auto_closed";
  } else {
    eventAction = "flagged";
  }

  // --- Record activity event ---
  await db.insert(activityEvents).values({
    contributorId: dbContributor.id,
    repositoryId: dbRepo.id,
    prTitle: pr.title,
    prNumber: pr.number,
    action: eventAction,
    trustScoreAtTime: trustScore,
  });

  // --- Enforce on GitHub ---
  if (installationId && action === "opened") {
    await enforce({
      installationId,
      owner: repo.owner.login,
      repoName: repo.name,
      prNumber: pr.number,
      eventAction,
      trustScore,
      autoLabel: dbRepo.autoLabel,
      autoClose: dbRepo.autoClose,
      contributorUsername: sender.login,
    });
  }

  return NextResponse.json({
    ok: true,
    trustScore,
    action: eventAction,
    contributor: dbContributor.username,
  });
}

async function handleInstallationEvent(
  payload: Record<string, unknown>,
  action: string
) {
  if (action === "deleted" || action === "suspend") {
    return NextResponse.json({ ok: true, action });
  }

  let reposToUpsert: {
    id: number;
    name: string;
    full_name: string;
    owner: { login: string };
  }[] = [];

  if (action === "created" || action === "new_permissions_accepted") {
    reposToUpsert = (payload.repositories as typeof reposToUpsert) ?? [];
  }

  if (action === "added") {
    reposToUpsert =
      (payload.repositories_added as typeof reposToUpsert) ?? [];
  }

  for (const repo of reposToUpsert) {
    await db
      .insert(repositories)
      .values({
        githubId: repo.id,
        name: repo.name,
        owner: repo.full_name.split("/")[0],
        fullName: repo.full_name,
        installedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: repositories.githubId,
        set: {
          name: repo.name,
          owner: repo.full_name.split("/")[0],
          fullName: repo.full_name,
          updatedAt: new Date().toISOString(),
        },
      });
  }

  if (action === "removed") {
    const removedRepos =
      (payload.repositories_removed as { id: number }[]) ?? [];
    for (const repo of removedRepos) {
      await db
        .update(repositories)
        .set({ status: "paused", updatedAt: new Date().toISOString() })
        .where(eq(repositories.githubId, repo.id));
    }
  }

  return NextResponse.json({
    ok: true,
    action,
    reposProcessed: reposToUpsert.length,
  });
}
