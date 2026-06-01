import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { runAutomaticScoreSync } from "@/lib/score-sync/sync";
import { revalidateMatchResultViews } from "@/lib/match-result-revalidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!hasValidSyncToken(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAutomaticScoreSync();
  if (result.updatedMatches > 0) {
    revalidateMatchResultViews();
  }

  return NextResponse.json(result, {
    status: result.status === "failed" ? 500 : 200,
  });
}

function hasValidSyncToken(authorization: string | null) {
  const expected = process.env.MATCH_SYNC_SECRET;
  if (!expected || !authorization?.startsWith("Bearer ")) {
    return false;
  }

  const token = authorization.slice("Bearer ".length);
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);
  return (
    tokenBuffer.length === expectedBuffer.length &&
    timingSafeEqual(tokenBuffer, expectedBuffer)
  );
}
