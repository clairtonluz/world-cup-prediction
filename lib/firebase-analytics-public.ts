export type FirebaseAnalyticsConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
};

export type FirebaseAnalyticsConfigResponse =
  | { enabled: true; config: FirebaseAnalyticsConfig }
  | { enabled: false };

export function isFirebaseAnalyticsConfigResponse(
  value: unknown,
): value is FirebaseAnalyticsConfigResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    !("enabled" in value) ||
    typeof value.enabled !== "boolean"
  ) {
    return false;
  }

  if (!value.enabled) {
    return true;
  }

  if (!("config" in value) || typeof value.config !== "object" || value.config === null) {
    return false;
  }

  const config = value.config as Partial<FirebaseAnalyticsConfig>;
  return (
    hasText(config.apiKey) &&
    hasText(config.authDomain) &&
    hasText(config.projectId) &&
    hasText(config.messagingSenderId) &&
    hasText(config.appId) &&
    hasText(config.measurementId) &&
    /^G-[A-Z0-9]+$/i.test(config.measurementId)
  );
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
