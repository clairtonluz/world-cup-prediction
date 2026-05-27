import { resolveFirebaseAnalyticsConfig } from "@/lib/firebase-analytics-config";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(resolveFirebaseAnalyticsConfig(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
