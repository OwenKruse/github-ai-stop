import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { repositories } from "@/lib/db/schema";

interface RepoImport {
  githubId: number;
  name: string;
  owner: string;
  fullName: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const repos: RepoImport[] = body.repos;

  if (!Array.isArray(repos) || repos.length === 0) {
    return NextResponse.json(
      { error: "No repos provided" },
      { status: 400 }
    );
  }

  const imported = await Promise.all(
    repos.map(async (repo) => {
      const [result] = await db
        .insert(repositories)
        .values({
          githubId: repo.githubId,
          name: repo.name,
          owner: repo.owner,
          fullName: repo.fullName,
          installedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: repositories.githubId,
          set: {
            name: repo.name,
            owner: repo.owner,
            fullName: repo.fullName,
            updatedAt: new Date().toISOString(),
          },
        })
        .returning();
      return result;
    })
  );

  revalidatePath("/dashboard", "layout");

  return NextResponse.json({ imported, count: imported.length });
}
