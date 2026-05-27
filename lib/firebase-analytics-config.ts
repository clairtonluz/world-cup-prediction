import { z } from "zod";
import type { FirebaseAnalyticsConfigResponse } from "@/lib/firebase-analytics-public";

const firebaseAnalyticsConfigSchema = z.object({
  apiKey: z.string().trim().min(1),
  authDomain: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
  messagingSenderId: z.string().trim().min(1),
  appId: z.string().trim().min(1),
  measurementId: z.string().trim().regex(/^G-[A-Z0-9]+$/i),
});

export function resolveFirebaseAnalyticsConfig(
  environment: NodeJS.ProcessEnv = process.env,
): FirebaseAnalyticsConfigResponse {
  const result = firebaseAnalyticsConfigSchema.safeParse({
    apiKey: environment.FIREBASE_API_KEY,
    authDomain: environment.FIREBASE_AUTH_DOMAIN,
    projectId: environment.FIREBASE_PROJECT_ID,
    messagingSenderId: environment.FIREBASE_MESSAGING_SENDER_ID,
    appId: environment.FIREBASE_APP_ID,
    measurementId: environment.FIREBASE_MEASUREMENT_ID,
  });

  return result.success ? { enabled: true, config: result.data } : { enabled: false };
}
