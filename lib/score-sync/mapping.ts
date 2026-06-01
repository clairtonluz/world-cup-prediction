import type { MatchStatusValue } from "@/lib/constants";
import type { MatchResultUpdate } from "@/lib/match-result-application";
import { SCORE_SYNC_LIVE_WINDOW_MINUTES } from "@/lib/score-sync/constants";
import type { EspnScoreboardEvent } from "@/lib/score-sync/client";

export type ScoreSyncableMatch = {
  id: string;
  matchNumber: number;
  espnEventId: string | null;
  scoreSyncLocked: boolean;
  startsAt: Date;
  status: string;
  stage: string;
  teamA: string | null;
  teamB: string | null;
};

export type EspnMappingResult =
  | { kind: "mapped"; result: MatchResultUpdate }
  | { kind: "skipped"; reason: string };

const TEAM_NAME_ALIASES: Record<string, string[]> = {
  "africa do sul": ["south africa", "rsa"],
  "arabia saudita": ["saudi arabia", "ksa"],
  "argelia": ["algeria"],
  "australia": ["australia", "aus"],
  "austria": ["austria"],
  "belgica": ["belgium"],
  "brasil": ["brazil"],
  "canada": ["canada"],
  "catar": ["qatar"],
  "colombia": ["colombia"],
  "coreia do sul": ["south korea", "korea republic", "kor"],
  "costa do marfim": ["ivory coast", "cote d ivoire"],
  "croacia": ["croatia"],
  "dinamarca": ["denmark"],
  "egito": ["egypt"],
  "equador": ["ecuador"],
  "espanha": ["spain"],
  "estados unidos": ["united states", "usa", "usmnt"],
  "franca": ["france"],
  "gana": ["ghana"],
  "holanda": ["netherlands"],
  "inglaterra": ["england"],
  "ira": ["iran", "ir iran"],
  "ir do ira": ["iran", "ir iran"],
  "japao": ["japan"],
  "marrocos": ["morocco"],
  "mexico": ["mexico"],
  "nova zelandia": ["new zealand"],
  "panama": ["panama"],
  "paraguai": ["paraguay"],
  "polonia": ["poland"],
  "portugal": ["portugal"],
  "republica da coreia": ["south korea", "korea republic", "kor"],
  "rd do congo": ["dr congo", "congo dr", "congo"],
  "ri do ira": ["iran", "ir iran"],
  "senegal": ["senegal"],
  "servia": ["serbia"],
  "suica": ["switzerland"],
  "tchequia": ["czechia", "czech republic"],
  "tunisia": ["tunisia"],
  "uruguai": ["uruguay"],
  "uzbequistao": ["uzbekistan"],
};

export function isEligibleForAutomaticScoreSync(match: ScoreSyncableMatch, now = new Date()) {
  if (!match.espnEventId || match.scoreSyncLocked || match.status === "FINISHED") {
    return false;
  }

  const startsAt = match.startsAt.getTime();
  const nowTime = now.getTime();
  const liveWindowMs = SCORE_SYNC_LIVE_WINDOW_MINUTES * 60 * 1000;
  return nowTime >= startsAt && nowTime < startsAt + liveWindowMs;
}

export function mapEspnEventToResult(
  event: EspnScoreboardEvent,
  match: ScoreSyncableMatch,
): EspnMappingResult {
  const status = espnStatusToMatchStatus(event);
  if (!status) {
    return { kind: "skipped", reason: "not_started" };
  }

  const competitors = event.competitions[0]?.competitors ?? [];
  const score = mapScoreToMatchSides(competitors, match);
  if (!score) {
    return { kind: "skipped", reason: "invalid_score" };
  }

  const advancingTeam = inferAdvancingTeam(competitors, match, score, status);
  if (advancingTeam === "missing") {
    return { kind: "skipped", reason: "missing_knockout_winner" };
  }

  return {
    kind: "mapped",
    result: {
      status,
      teamAScore: score.teamAScore,
      teamBScore: score.teamBScore,
      advancingTeam,
    },
  };
}

export function espnDateKeyForMatch(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date).replaceAll("-", "");
}

export function normalizeFootballName(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function footballNamesMatch(appTeam: string | null, providerTeam: string | null | undefined) {
  const appName = normalizeFootballName(appTeam);
  const providerName = normalizeFootballName(providerTeam);
  if (!appName || !providerName) {
    return false;
  }

  return appName === providerName || (TEAM_NAME_ALIASES[appName] ?? []).includes(providerName);
}

function espnStatusToMatchStatus(event: EspnScoreboardEvent): MatchStatusValue | null {
  const type = event.status.type;
  if (type.completed || type.state === "post") {
    return "FINISHED";
  }
  if (type.state === "in") {
    return "STARTED";
  }
  return null;
}

function mapScoreToMatchSides(
  competitors: EspnScoreboardEvent["competitions"][number]["competitors"],
  match: ScoreSyncableMatch,
) {
  const side = matchEspnSide(competitors, match);
  if (!side) {
    return null;
  }

  const teamAScore = parseScore(side.teamA.score);
  const teamBScore = parseScore(side.teamB.score);
  if (teamAScore === null || teamBScore === null) {
    return null;
  }

  return { teamAScore, teamBScore };
}

function matchEspnSide(
  competitors: EspnScoreboardEvent["competitions"][number]["competitors"],
  match: ScoreSyncableMatch,
) {
  const teamA = competitors.find((competitor) =>
    footballNamesMatch(match.teamA, competitor.team.displayName),
  );
  const teamB = competitors.find((competitor) =>
    footballNamesMatch(match.teamB, competitor.team.displayName),
  );

  if (teamA && teamB && teamA !== teamB) {
    return { teamA, teamB };
  }

  const home = competitors.find((competitor) => competitor.homeAway === "home");
  const away = competitors.find((competitor) => competitor.homeAway === "away");
  return home && away ? { teamA: home, teamB: away } : null;
}

function parseScore(score: string | null | undefined) {
  if (score === null || score === undefined || score === "") {
    return null;
  }

  const parsed = Number(score);
  return Number.isInteger(parsed) ? parsed : null;
}

function inferAdvancingTeam(
  competitors: EspnScoreboardEvent["competitions"][number]["competitors"],
  match: ScoreSyncableMatch,
  score: { teamAScore: number; teamBScore: number },
  status: MatchStatusValue,
) {
  if (status !== "FINISHED" || match.stage === "GROUP_STAGE" || score.teamAScore !== score.teamBScore) {
    return null;
  }

  const side = matchEspnSide(competitors, match);
  if (!side) {
    return "missing" as const;
  }

  if (side.teamA.winner) {
    return match.teamA;
  }
  if (side.teamB.winner) {
    return match.teamB;
  }

  return "missing" as const;
}
