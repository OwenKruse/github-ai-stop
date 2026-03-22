import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contributors } from "@/lib/db/schema";
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
  const contributorId = parseInt(id, 10);
  if (isNaN(contributorId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof body.isWhitelisted === "boolean") {
    update.isWhitelisted = body.isWhitelisted;
    if (body.isWhitelisted) {
      update.trustScore = 100;
      update.isBlocked = false;
    }
  }

  if (typeof body.isBlocked === "boolean") {
    update.isBlocked = body.isBlocked;
    if (body.isBlocked) {
      update.trustScore = 0;
      update.isWhitelisted = false;
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

  return NextResponse.json(updated);
}
