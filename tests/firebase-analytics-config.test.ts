import { describe, expect, it } from "vitest";
import { resolveFirebaseAnalyticsConfig } from "@/lib/firebase-analytics-config";

const validEnvironment = {
  FIREBASE_API_KEY: "browser-api-key",
  FIREBASE_AUTH_DOMAIN: "world-cup-prediction.firebaseapp.com",
  FIREBASE_PROJECT_ID: "world-cup-prediction",
  FIREBASE_MESSAGING_SENDER_ID: "123456789",
  FIREBASE_APP_ID: "1:123456789:web:abcdef",
  FIREBASE_MEASUREMENT_ID: "G-ABCD1234",
};

describe("resolveFirebaseAnalyticsConfig", () => {
  it("exposes a complete Firebase web analytics configuration", () => {
    expect(resolveFirebaseAnalyticsConfig(validEnvironment)).toEqual({
      enabled: true,
      config: {
        apiKey: "browser-api-key",
        authDomain: "world-cup-prediction.firebaseapp.com",
        projectId: "world-cup-prediction",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:abcdef",
        measurementId: "G-ABCD1234",
      },
    });
  });

  it("disables analytics when configuration is absent or incomplete", () => {
    expect(resolveFirebaseAnalyticsConfig({})).toEqual({ enabled: false });
    expect(
      resolveFirebaseAnalyticsConfig({
        ...validEnvironment,
        FIREBASE_APP_ID: undefined,
      }),
    ).toEqual({ enabled: false });
  });

  it("disables analytics for an invalid measurement id", () => {
    expect(
      resolveFirebaseAnalyticsConfig({
        ...validEnvironment,
        FIREBASE_MEASUREMENT_ID: "UA-legacy-id",
      }),
    ).toEqual({ enabled: false });
  });
});
