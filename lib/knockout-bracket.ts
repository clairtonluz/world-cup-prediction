import {
  STAGE_LABELS,
  type MatchStageValue,
  type MatchStatusValue,
} from "@/lib/constants";
import {
  resolveBracketParticipants,
  type BracketMatch,
  type ParticipantResolution,
} from "@/lib/bracket";

export const KNOCKOUT_STAGES = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "FINAL",
  "THIRD_PLACE_MATCH",
] as const satisfies readonly MatchStageValue[];

export type KnockoutStageValue = (typeof KNOCKOUT_STAGES)[number];

export type KnockoutPrediction = {
  teamAScore: number;
  teamBScore: number;
  predictedAdvancingTeam: string | null;
  points: number;
};

export type KnockoutBracketMatchInput = BracketMatch & {
  id: string;
  participantsConfirmed: boolean;
  startsAt: Date;
  venue: string;
  hostCity: string;
  predictions?: KnockoutPrediction[];
};

export type KnockoutBracketSide = {
  team: string | null;
  slot: string | null;
  projected: boolean;
};

export type KnockoutBracketMatch = {
  id: string;
  matchNumber: number;
  stage: KnockoutStageValue;
  startsAt: Date;
  venue: string;
  hostCity: string;
  status: MatchStatusValue;
  teamAScore: number | null;
  teamBScore: number | null;
  advancingTeam: string | null;
  participantsConfirmed: boolean;
  projected: boolean;
  sourceMatchNumbers: number[];
  teamA: KnockoutBracketSide;
  teamB: KnockoutBracketSide;
  prediction: KnockoutPrediction | null;
};

export type KnockoutBracketStage = {
  stage: KnockoutStageValue;
  label: string;
  matches: KnockoutBracketMatch[];
};

export type KnockoutBracket = {
  stages: KnockoutBracketStage[];
  hasProjectedParticipants: boolean;
};

const knockoutStageOrder = new Map<MatchStageValue, number>(
  KNOCKOUT_STAGES.map((stage, index) => [stage, index]),
);

export function buildKnockoutBracket(
  matches: KnockoutBracketMatchInput[],
): KnockoutBracket {
  const resolutions = resolveBracketParticipants(matches);
  const pathKeys = buildBracketPathKeys(matches);
  const knockoutMatches = matches
    .filter((match): match is KnockoutBracketMatchInput & { stage: KnockoutStageValue } =>
      isKnockoutStage(match.stage),
    )
    .sort((a, b) => compareKnockoutMatches(a, b, pathKeys))
    .map((match) => toBracketMatch(match, resolutions.get(match.matchNumber)));

  const stages = KNOCKOUT_STAGES.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    matches: knockoutMatches.filter((match) => match.stage === stage),
  }));

  return {
    stages,
    hasProjectedParticipants: knockoutMatches.some((match) => match.projected),
  };
}

function toBracketMatch(
  match: KnockoutBracketMatchInput & { stage: KnockoutStageValue },
  resolution: ParticipantResolution | undefined,
): KnockoutBracketMatch {
  const teamA = resolveSide({
    confirmedTeam: match.teamA,
    projectedTeam: resolution?.teamA ?? null,
    slot: match.teamASlot,
    participantsConfirmed: match.participantsConfirmed,
    resolutionConfirmed: resolution?.participantsConfirmed ?? false,
  });
  const teamB = resolveSide({
    confirmedTeam: match.teamB,
    projectedTeam: resolution?.teamB ?? null,
    slot: match.teamBSlot,
    participantsConfirmed: match.participantsConfirmed,
    resolutionConfirmed: resolution?.participantsConfirmed ?? false,
  });

  return {
    id: match.id,
    matchNumber: match.matchNumber,
    stage: match.stage,
    startsAt: match.startsAt,
    venue: match.venue,
    hostCity: match.hostCity,
    status: match.status,
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    advancingTeam: match.advancingTeam,
    participantsConfirmed: match.participantsConfirmed,
    projected: teamA.projected || teamB.projected,
    sourceMatchNumbers: sourceMatchNumbers(match),
    teamA,
    teamB,
    prediction: match.predictions?.[0] ?? null,
  };
}

function resolveSide({
  confirmedTeam,
  projectedTeam,
  slot,
  participantsConfirmed,
  resolutionConfirmed,
}: {
  confirmedTeam: string | null;
  projectedTeam: string | null;
  slot: string | null;
  participantsConfirmed: boolean;
  resolutionConfirmed: boolean;
}): KnockoutBracketSide {
  const officiallyConfirmed = participantsConfirmed || resolutionConfirmed;

  if (confirmedTeam) {
    return {
      team: confirmedTeam,
      slot,
      projected: !officiallyConfirmed,
    };
  }

  return {
    team: projectedTeam,
    slot,
    projected: projectedTeam !== null && !officiallyConfirmed,
  };
}

function compareKnockoutMatches(
  a: KnockoutBracketMatchInput,
  b: KnockoutBracketMatchInput,
  pathKeys: Map<number, string>,
) {
  const stageComparison =
    (knockoutStageOrder.get(a.stage) ?? Number.MAX_SAFE_INTEGER) -
    (knockoutStageOrder.get(b.stage) ?? Number.MAX_SAFE_INTEGER);

  if (stageComparison !== 0) {
    return stageComparison;
  }

  return (
    comparePathKeys(pathKeys.get(a.matchNumber), pathKeys.get(b.matchNumber)) ||
    a.matchNumber - b.matchNumber
  );
}

function buildBracketPathKeys(matches: KnockoutBracketMatchInput[]) {
  const matchesByNumber = new Map(matches.map((match) => [match.matchNumber, match]));
  const pathKeys = new Map<number, string>();
  const roots = [
    ...matches.filter((match) => match.stage === "FINAL"),
    ...matches.filter((match) => match.stage === "THIRD_PLACE_MATCH"),
  ].sort(
    (a, b) =>
      (knockoutStageOrder.get(a.stage) ?? 0) -
        (knockoutStageOrder.get(b.stage) ?? 0) ||
      a.matchNumber - b.matchNumber,
  );

  roots.forEach((match, index) =>
    assignBracketPath(match.matchNumber, [index], matchesByNumber, pathKeys),
  );

  return pathKeys;
}

function assignBracketPath(
  matchNumber: number,
  path: number[],
  matchesByNumber: Map<number, KnockoutBracketMatchInput>,
  pathKeys: Map<number, string>,
) {
  const pathKey = path.map((value) => value.toString().padStart(2, "0")).join(".");
  const existingPathKey = pathKeys.get(matchNumber);

  if (!existingPathKey || comparePathKeys(pathKey, existingPathKey) < 0) {
    pathKeys.set(matchNumber, pathKey);
  }

  const match = matchesByNumber.get(matchNumber);
  if (!match) {
    return;
  }

  sourceMatchNumbers(match).forEach((sourceMatchNumber, index) => {
    assignBracketPath(
      sourceMatchNumber,
      [...path, index],
      matchesByNumber,
      pathKeys,
    );
  });
}

function comparePathKeys(a: string | undefined, b: string | undefined) {
  if (a && b) {
    return a.localeCompare(b);
  }

  if (a) {
    return -1;
  }

  if (b) {
    return 1;
  }

  return 0;
}

function sourceMatchNumbers(match: Pick<BracketMatch, "teamASlot" | "teamBSlot">) {
  return [match.teamASlot, match.teamBSlot].flatMap((slot) => {
    const source = slot?.match(/^(?:W|RU)(\d+)$/);
    return source ? [Number(source[1])] : [];
  });
}

function isKnockoutStage(stage: MatchStageValue): stage is KnockoutStageValue {
  return knockoutStageOrder.has(stage);
}
