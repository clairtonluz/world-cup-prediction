import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { EspnScoreboardRequestError, fetchEspnScoreboard, type EspnScoreboardEvent } from "@/lib/score-sync/client";
import {
  SCORE_SYNC_LIVE_WINDOW_MINUTES,
  SCORE_SYNC_SETTINGS_ID,
} from "@/lib/score-sync/constants";
import {
  espnDateKeyForMatch,
  footballNamesMatch,
  isEligibleForAutomaticScoreSync,
  mapEspnEventToResult,
  type ScoreSyncableMatch,
} from "@/lib/score-sync/mapping";
import { getDb } from "@/lib/db";
import type { ErrorFeedbackCode } from "@/lib/feedback";
import { applyMatchResult } from "@/lib/match-result-application";
import { runSerializableTransaction } from "@/lib/transactions";

const SYNC_LOCK_STALE_AFTER_MS = 5 * 60 * 1000;
const EVENT_IMPORT_TIME_TOLERANCE_MS = 5 * 60 * 1000;

const syncableMatchSelect = {
  id: true,
  matchNumber: true,
  espnEventId: true,
  scoreSyncLocked: true,
  startsAt: true,
  status: true,
  stage: true,
  teamA: true,
  teamB: true,
} as const;

export type ScoreSyncSettingsValue = {
  id: string;
  enabled: boolean;
  intervalMinutes: number;
  lastSyncStartedAt: Date | null;
  lastSyncFinishedAt: Date | null;
  lastSuccessfulSyncAt: Date | null;
  lastSyncSummary: string | null;
  lastSyncError: string | null;
  remainingRequests: number | null;
  syncInProgressSince: Date | null;
};

export type ScoreSyncResult = {
  status: "completed" | "disabled" | "not_due" | "no_matches" | "locked" | "failed";
  checkedMatches: number;
  updatedMatches: number;
  skippedMatches: number;
  errors: string[];
  remainingRequests: number | null;
};

export type EspnEventImportResult = {
  mapped: number;
  unchanged: number;
  ambiguous: number;
  unmatched: number;
  remainingRequests: number | null;
};

export async function getScoreSyncSettings(
  db: Pick<Prisma.TransactionClient, "scoreSyncSettings"> = getDb(),
): Promise<ScoreSyncSettingsValue> {
  return db.scoreSyncSettings.upsert({
    where: { id: SCORE_SYNC_SETTINGS_ID },
    update: {},
    create: { id: SCORE_SYNC_SETTINGS_ID },
  });
}

export async function updateScoreSyncSettings(input: {
  enabled: boolean;
  intervalMinutes: number;
}) {
  return getDb().scoreSyncSettings.upsert({
    where: { id: SCORE_SYNC_SETTINGS_ID },
    update: input,
    create: { id: SCORE_SYNC_SETTINGS_ID, ...input },
  });
}

export async function setMatchScoreSyncLocked(matchId: string, locked: boolean) {
  return getDb().match.update({
    where: { id: matchId },
    data: { scoreSyncLocked: locked },
  });
}

export async function runAutomaticScoreSync(now = new Date()): Promise<ScoreSyncResult> {
  const db = getDb();
  const settings = await getScoreSyncSettings(db);
  if (!settings.enabled) {
    return emptySyncResult("disabled");
  }

  if (!isAutomaticSyncDue(settings, now)) {
    return emptySyncResult("not_due");
  }

  const matches = await listAutomaticallySyncableMatches(db, now);
  if (matches.length === 0) {
    return emptySyncResult("no_matches");
  }

  return runLockedScoreSync(matches, now);
}

export async function runManualScoreSync(now = new Date()) {
  const db = getDb();
  const matches = await listAutomaticallySyncableMatches(db, now);
  if (matches.length === 0) {
    return emptySyncResult("no_matches");
  }

  return runLockedScoreSync(matches, now);
}

export async function runSingleMatchScoreSync(
  matchId: string,
  options: { overrideLock: boolean; now?: Date },
): Promise<{ error: ErrorFeedbackCode | null; result: ScoreSyncResult }> {
  const now = options.now ?? new Date();
  const match = await getDb().match.findUnique({
    where: { id: matchId },
    select: syncableMatchSelect,
  });

  if (!match) {
    return { error: "match_not_found", result: emptySyncResult("failed") };
  }

  if (!match.espnEventId) {
    return { error: "score_sync_event_missing", result: emptySyncResult("failed") };
  }

  if (match.startsAt.getTime() > now.getTime()) {
    return { error: "score_sync_match_not_started", result: emptySyncResult("failed") };
  }

  if (match.scoreSyncLocked && !options.overrideLock) {
    return { error: "score_sync_match_locked", result: emptySyncResult("failed") };
  }

  const result = await runLockedScoreSync([match], now);
  return {
    error: result.status === "failed" ? "score_sync_failed" : null,
    result,
  };
}

export async function importEspnEventIds(): Promise<EspnEventImportResult> {
  const matches = await getDb().match.findMany({
    select: {
      id: true,
      espnEventId: true,
      startsAt: true,
      teamA: true,
      teamB: true,
    },
    orderBy: { matchNumber: "asc" },
  });
  const events = await fetchEventsForDates(uniqueDateKeys(matches.map((match) => match.startsAt)));

  const result: EspnEventImportResult = {
    mapped: 0,
    unchanged: 0,
    ambiguous: 0,
    unmatched: 0,
    remainingRequests: null,
  };
  const usedEventIds = new Set<string>();

  for (const match of matches) {
    const event = findEventForMatch(match, events, usedEventIds);
    if (event === "ambiguous") {
      result.ambiguous += 1;
      continue;
    }

    if (!event) {
      result.unmatched += 1;
      continue;
    }

    usedEventIds.add(event.id);
    if (match.espnEventId === event.id) {
      result.unchanged += 1;
      continue;
    }

    await getDb().match.update({
      where: { id: match.id },
      data: { espnEventId: event.id },
    });
    result.mapped += 1;
  }

  return result;
}

export function isAutomaticSyncDue(
  settings: Pick<ScoreSyncSettingsValue, "intervalMinutes" | "lastSyncFinishedAt">,
  now = new Date(),
) {
  if (!settings.lastSyncFinishedAt) {
    return true;
  }

  const intervalMs = settings.intervalMinutes * 60 * 1000;
  return now.getTime() - settings.lastSyncFinishedAt.getTime() >= intervalMs;
}

async function listAutomaticallySyncableMatches(
  db: Pick<Prisma.TransactionClient, "match">,
  now: Date,
): Promise<ScoreSyncableMatch[]> {
  const possibleMatches = await db.match.findMany({
    where: {
      espnEventId: { not: null },
      scoreSyncLocked: false,
      status: { not: "FINISHED" },
      startsAt: {
        lte: now,
        gt: new Date(now.getTime() - SCORE_SYNC_LIVE_WINDOW_MINUTES * 60 * 1000),
      },
    },
    select: syncableMatchSelect,
    orderBy: [{ startsAt: "asc" }, { matchNumber: "asc" }],
  });

  return possibleMatches.filter((match) => isEligibleForAutomaticScoreSync(match, now));
}

async function runLockedScoreSync(
  matches: ScoreSyncableMatch[],
  now: Date,
): Promise<ScoreSyncResult> {
  if (!(await acquireScoreSyncLock(now))) {
    return emptySyncResult("locked");
  }

  try {
    const result = await syncMatchesFromEspn(matches);
    await recordSyncCompletion(result, now);
    return result;
  } catch (error) {
    const result = failedSyncResult(error);
    await recordSyncCompletion(result, now);
    return result;
  }
}

async function syncMatchesFromEspn(matches: ScoreSyncableMatch[]): Promise<ScoreSyncResult> {
  const events = await fetchEventsForDates(uniqueDateKeys(matches.map((match) => match.startsAt)));
  const eventById = new Map(events.map((event) => [event.id, event]));

  const result: ScoreSyncResult = {
    status: "completed",
    checkedMatches: matches.length,
    updatedMatches: 0,
    skippedMatches: 0,
    errors: [],
    remainingRequests: null,
  };

  for (const match of matches) {
    const event = match.espnEventId ? eventById.get(match.espnEventId) : null;
    if (!event) {
      result.skippedMatches += 1;
      result.errors.push(`match:${match.matchNumber}:event_not_found`);
      continue;
    }

    const mapped = mapEspnEventToResult(event, match);
    if (mapped.kind === "skipped") {
      result.skippedMatches += 1;
      result.errors.push(`match:${match.matchNumber}:${mapped.reason}`);
      continue;
    }

    const applied = await runSerializableTransaction((tx) =>
      applyMatchResult(tx, match.id, mapped.result),
    );
    if (applied.error) {
      result.skippedMatches += 1;
      result.errors.push(`match:${match.matchNumber}:${applied.error}`);
      continue;
    }

    result.updatedMatches += 1;
  }

  return result;
}

async function fetchEventsForDates(dateKeys: string[]) {
  const eventsById = new Map<string, EspnScoreboardEvent>();
  for (const dateKey of dateKeys) {
    const events = await fetchEspnScoreboard(dateKey);
    for (const event of events) {
      eventsById.set(event.id, event);
    }
  }
  return [...eventsById.values()];
}

async function acquireScoreSyncLock(now: Date) {
  await getScoreSyncSettings();
  const staleBefore = new Date(now.getTime() - SYNC_LOCK_STALE_AFTER_MS);
  const update = await getDb().scoreSyncSettings.updateMany({
    where: {
      id: SCORE_SYNC_SETTINGS_ID,
      OR: [
        { syncInProgressSince: null },
        { syncInProgressSince: { lt: staleBefore } },
      ],
    },
    data: {
      syncInProgressSince: now,
      lastSyncStartedAt: now,
    },
  });

  return update.count === 1;
}

async function recordSyncCompletion(result: ScoreSyncResult, now: Date) {
  const failed = result.status === "failed";
  await getDb().scoreSyncSettings.update({
    where: { id: SCORE_SYNC_SETTINGS_ID },
    data: {
      syncInProgressSince: null,
      lastSyncFinishedAt: now,
      lastSuccessfulSyncAt: failed ? undefined : now,
      lastSyncSummary: syncSummary(result),
      lastSyncError: failed ? result.errors[0] ?? "ESPN score sync failed" : null,
      remainingRequests: null,
    },
  });
}

function emptySyncResult(status: ScoreSyncResult["status"]): ScoreSyncResult {
  return {
    status,
    checkedMatches: 0,
    updatedMatches: 0,
    skippedMatches: 0,
    errors: [],
    remainingRequests: null,
  };
}

function failedSyncResult(error: unknown): ScoreSyncResult {
  const safeMessage =
    error instanceof EspnScoreboardRequestError
      ? error.message
      : error instanceof Error
        ? error.name
        : "ESPN score sync failed";

  return {
    ...emptySyncResult("failed"),
    errors: [safeMessage],
  };
}

function syncSummary(result: ScoreSyncResult) {
  return [
    `status=${result.status}`,
    `checked=${result.checkedMatches}`,
    `updated=${result.updatedMatches}`,
    `skipped=${result.skippedMatches}`,
  ].join(" ");
}

function uniqueDateKeys(dates: Date[]) {
  return [...new Set(dates.map(espnDateKeyForMatch))].sort();
}

function findEventForMatch(
  match: {
    espnEventId: string | null;
    startsAt: Date;
    teamA: string | null;
    teamB: string | null;
  },
  events: EspnScoreboardEvent[],
  usedEventIds: Set<string>,
) {
  const exact = events.find(
    (event) => !usedEventIds.has(event.id) && match.espnEventId === event.id,
  );
  if (exact) {
    return exact;
  }

  const timeMatches = events.filter(
    (event) =>
      !usedEventIds.has(event.id) &&
      Math.abs(match.startsAt.getTime() - new Date(event.date).getTime()) <=
        EVENT_IMPORT_TIME_TOLERANCE_MS,
  );
  if (timeMatches.length <= 1) {
    return timeMatches[0] ?? null;
  }

  const teamMatches = timeMatches.filter((event) => eventTeamsMatch(event, match));
  if (teamMatches.length === 1) {
    return teamMatches[0];
  }

  return "ambiguous" as const;
}

function eventTeamsMatch(
  event: EspnScoreboardEvent,
  match: { teamA: string | null; teamB: string | null },
) {
  const competitors = event.competitions[0]?.competitors ?? [];
  return Boolean(
    competitors.some((competitor) =>
      footballNamesMatch(match.teamA, competitor.team.displayName),
    ) &&
      competitors.some((competitor) =>
        footballNamesMatch(match.teamB, competitor.team.displayName),
      ),
  );
}
