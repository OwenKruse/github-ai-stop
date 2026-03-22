import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { repositories, activityEvents } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const repoId = parseInt(id, 10);
  if (isNaN(repoId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof body.trustThreshold === "number") {
    update.trustThreshold = Math.max(0, Math.min(100, body.trustThreshold));
  }
  if (typeof body.autoClose === "boolean") {
    update.autoClose = body.autoClose;
  }
  if (typeof body.autoLabel === "boolean") {
    update.autoLabel = body.autoLabel;
  }
  if (typeof body.status === "string" && ["active", "paused", "error"].includes(body.status)) {
    update.status = body.status;
  }

  const [updated] = await db
    .update(repositories)
    .set(update)
    .where(eq(repositories.id, repoId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const repoId = parseInt(id, 10);
  if (isNaN(repoId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  await db
    .delete(activityEvents)
    .where(eq(activityEvents.repositoryId, repoId));

  const [deleted] = await db
    .delete(repositories)
    .where(eq(repositories.id, repoId))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
