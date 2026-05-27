"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import type { Analytics } from "firebase/analytics";
import { resolveAnalyticsPage, type AnalyticsPage } from "@/lib/analytics-routes";
import {
  isFirebaseAnalyticsConfigResponse,
  type FirebaseAnalyticsConfig,
} from "@/lib/firebase-analytics-public";

const CONSENT_STORAGE_KEY = "world-cup-prediction.analytics-consent.v1";
const CONSENT_CHANGED_EVENT = "analytics-consent-changed";
const FIREBASE_APP_NAME = "world-cup-prediction-analytics";

type ConsentPreference = "granted" | "denied";

type FirebaseAnalyticsModule = typeof import("firebase/analytics");

type FirebaseAnalyticsState = {
  instance: Analytics;
  module: FirebaseAnalyticsModule;
};

const grantedConsent = {
  analytics_storage: "granted",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  personalization_storage: "denied",
} as const;

const deniedConsent = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  personalization_storage: "denied",
} as const;

export function FirebaseAnalyticsConsent() {
  const pathname = usePathname();
  const preference = useSyncExternalStore(
    subscribeToConsentPreference,
    readConsentPreference,
    () => null,
  );
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [analyticsState, setAnalyticsState] = useState<FirebaseAnalyticsState | null>(null);
  const initializationRef = useRef<Promise<FirebaseAnalyticsState | null> | null>(null);
  const lastTrackedNavigationRef = useRef<string | null>(null);

  useEffect(() => {
    if (preference !== "granted" || analyticsState || initializationRef.current) {
      return;
    }

    const initialPage = currentAnalyticsPage(pathname);
    if (!initialPage) {
      return;
    }

    initializationRef.current = initializeFirebaseAnalytics(initialPage)
      .then((state) => {
        setAnalyticsState(state);
        return state;
      })
      .catch(() => null);
  }, [analyticsState, pathname, preference]);

  useEffect(() => {
    if (!analyticsState || preference !== "granted") {
      return;
    }

    const page = currentAnalyticsPage(pathname);
    if (!page) {
      return;
    }

    const navigationKey = `${pathname}:${page.path}`;
    if (lastTrackedNavigationRef.current === navigationKey) {
      return;
    }

    const parameters = safePageParameters(page);
    analyticsState.module.setConsent(grantedConsent);
    analyticsState.module.setAnalyticsCollectionEnabled(analyticsState.instance, true);
    analyticsState.module.setDefaultEventParameters(parameters);
    analyticsState.module.logEvent(analyticsState.instance, "page_view", parameters);
    lastTrackedNavigationRef.current = navigationKey;
  }, [analyticsState, pathname, preference]);

  useEffect(() => {
    if (preference === "denied" && analyticsState) {
      lastTrackedNavigationRef.current = null;
      deleteAnalyticsCookies();
      analyticsState.module.setConsent(deniedConsent);
      analyticsState.module.setAnalyticsCollectionEnabled(analyticsState.instance, false);
    }
  }, [analyticsState, preference]);

  function savePreference(nextPreference: ConsentPreference) {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, nextPreference);
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    setIsPreferencesOpen(false);
  }

  return (
    <>
      {(preference === null || isPreferencesOpen) && (
        <aside
          aria-label="Preferências de cookies"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl shadow-black/20"
        >
          <h2 className="text-base font-semibold">Cookies de análise</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Usamos Google Analytics para Firebase somente com sua autorização para medir
            visitas às páginas do bolão. URLs privadas e parâmetros não são enviados.
            Consulte a{" "}
            <a
              className="font-medium text-[#0756ac] hover:underline"
              href="https://policies.google.com/privacy"
              rel="noreferrer"
              target="_blank"
            >
              política de privacidade do Google
            </a>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-lg bg-[#080b12] px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              onClick={() => savePreference("granted")}
              type="button"
            >
              Aceitar análise
            </button>
            <button
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              onClick={() => savePreference("denied")}
              type="button"
            >
              Recusar
            </button>
          </div>
        </aside>
      )}
      {preference !== null && !isPreferencesOpen && (
        <button
          className="fixed bottom-3 left-3 z-40 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow hover:bg-slate-50"
          onClick={() => setIsPreferencesOpen(true)}
          type="button"
        >
          Preferências de cookies
        </button>
      )}
    </>
  );
}

async function initializeFirebaseAnalytics(page: AnalyticsPage): Promise<FirebaseAnalyticsState | null> {
  const response = await fetch("/api/analytics/config", { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const configResponse: unknown = await response.json();
  if (!isFirebaseAnalyticsConfigResponse(configResponse) || !configResponse.enabled) {
    return null;
  }

  const [firebaseAppModule, firebaseAnalyticsModule] = await Promise.all([
    import("firebase/app"),
    import("firebase/analytics"),
  ]);

  if (!(await firebaseAnalyticsModule.isSupported())) {
    return null;
  }

  firebaseAnalyticsModule.setConsent(grantedConsent);
  firebaseAnalyticsModule.setDefaultEventParameters(safePageParameters(page));

  const existingApp = firebaseAppModule
    .getApps()
    .find((firebaseApp) => firebaseApp.name === FIREBASE_APP_NAME);
  const firebaseApp =
    existingApp ?? firebaseAppModule.initializeApp(firebaseOptions(configResponse.config), FIREBASE_APP_NAME);
  const instance = existingApp
    ? firebaseAnalyticsModule.getAnalytics(firebaseApp)
    : firebaseAnalyticsModule.initializeAnalytics(firebaseApp, {
        config: {
          ...safePageParameters(page),
          send_page_view: false,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        },
      });

  firebaseAnalyticsModule.setAnalyticsCollectionEnabled(instance, true);
  return { instance, module: firebaseAnalyticsModule };
}

function currentAnalyticsPage(pathname: string): AnalyticsPage | null {
  const isNotFound = document.querySelector("[data-analytics-not-found]") !== null;
  return resolveAnalyticsPage(pathname, isNotFound);
}

function safePageParameters(page: AnalyticsPage) {
  return {
    page_location: `${window.location.origin}${page.path}`,
    page_path: page.path,
    page_title: page.title,
    page_referrer: "",
  };
}

function firebaseOptions(config: FirebaseAnalyticsConfig) {
  return {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
    measurementId: config.measurementId,
  };
}

function readConsentPreference(): ConsentPreference | null {
  const storedPreference = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return storedPreference === "granted" || storedPreference === "denied" ? storedPreference : null;
}

function subscribeToConsentPreference(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CONSENT_CHANGED_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
  };
}

function deleteAnalyticsCookies() {
  for (const entry of document.cookie.split(";")) {
    const name = entry.split("=")[0]?.trim();
    if (!name?.startsWith("_ga")) {
      continue;
    }

    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${window.location.hostname}; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${window.location.hostname}; SameSite=Lax`;
  }
}
