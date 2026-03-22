import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchContributors } from "@/lib/db/queries";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json([]);
  }

  const results = await searchContributors(q);
  return NextResponse.json(results);
}
