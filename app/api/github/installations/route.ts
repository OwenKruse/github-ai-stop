import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

async function getValidGitHubToken(userId: string): Promise<{
  token: string;
  error?: never;
} | {
  token?: never;
  error: string;
  needsReauth?: boolean;
}> {
  const [account] = await db
    .select()
    .from(accounts)
    .where(
      and(eq(accounts.userId, userId), eq(accounts.provider, "github"))
    );

  if (!account?.access_token) {
    return { error: "No GitHub account linked. Please sign out and sign in again.", needsReauth: true };
  }

  const now = Math.floor(Date.now() / 1000);
  const isExpired = account.expires_at && account.expires_at < now;

  if (!isExpired) {
    return { token: account.access_token };
  }

  if (!account.refresh_token) {
    return { error: "GitHub token expired. Please sign out and sign in again.", needsReauth: true };
  }

  const clientId = process.env.AUTH_GITHUB_ID;
  const clientSecret = process.env.AUTH_GITHUB_SECRET;

  if (!clientId || !clientSecret) {
    return { error: "Server configuration error." };
  }

  const refreshRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  if (!refreshRes.ok) {
    return { error: "Failed to refresh GitHub token. Please sign out and sign in again.", needsReauth: true };
  }

  const data = await refreshRes.json();

  if (data.error) {
    console.error("GitHub token refresh error:", data.error, data.error_description);
    return { error: "GitHub token expired. Please sign out and sign in again.", needsReauth: true };
  }

  await db
    .update(accounts)
    .set({
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? account.refresh_token,
      expires_at: data.expires_in
        ? Math.floor(Date.now() / 1000) + data.expires_in
        : account.expires_at,
      token_type: data.token_type ?? account.token_type,
    })
    .where(
      and(eq(accounts.userId, userId), eq(accounts.provider, "github"))
    );

  return { token: data.access_token };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not authenticated. Please sign in.", needsReauth: true },
      { status: 401 }
    );
  }

  const result = await getValidGitHubToken(session.user.id);

  if (result.error) {
    return NextResponse.json(
      { error: result.error, needsReauth: result.needsReauth ?? false },
      { status: 401 }
    );
  }

  const token = result.token;

  const installationsRes = await fetch(
    "https://api.github.com/user/installations",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!installationsRes.ok) {
    const errorBody = await installationsRes.text();
    console.error(
      `GitHub /user/installations failed (${installationsRes.status}):`,
      errorBody
    );

    if (installationsRes.status === 401) {
      return NextResponse.json(
        {
          error: "GitHub token is invalid. Please sign out and sign in again.",
          needsReauth: true,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch GitHub installations." },
      { status: 502 }
    );
  }

  const data = await installationsRes.json();
  const allInstallations: {
    id: number;
    app_id: number;
    account: { login: string; avatar_url: string };
  }[] = data.installations ?? [];

  const appId = process.env.GITHUB_APP_ID;
  const appInstallations = appId
    ? allInstallations.filter((inst) => String(inst.app_id) === appId)
    : allInstallations;

  const results = await Promise.all(
    appInstallations.map(async (inst) => {
      const reposRes = await fetch(
        `https://api.github.com/user/installations/${inst.id}/repositories?per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      let repos: {
        id: number;
        name: string;
        full_name: string;
        owner: { login: string };
        private: boolean;
      }[] = [];

      if (reposRes.ok) {
        const repoData = await reposRes.json();
        repos = repoData.repositories ?? [];
      }

      return {
        installationId: inst.id,
        account: {
          login: inst.account.login,
          avatarUrl: inst.account.avatar_url,
        },
        repos: repos.map((r) => ({
          githubId: r.id,
          name: r.name,
          fullName: r.full_name,
          owner: r.owner.login,
          isPrivate: r.private,
        })),
      };
    })
  );

  return NextResponse.json({
    installations: results,
    totalInstallations: allInstallations.length,
    matchedInstallations: appInstallations.length,
  });
}
