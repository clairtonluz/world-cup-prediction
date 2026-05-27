import type { MatchStageValue, MatchStatusValue } from "@/lib/constants";
import { hasEffectivelyStarted } from "@/lib/match-rules";

export const CHAMPION_BONUS_POINTS = 200;

const ADVANCING_TEAM_PREDICTION_STAGES: ReadonlySet<MatchStageValue> = new Set([
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
]);

type OpeningMatch = {
  startsAt: Date;
  status: MatchStatusValue;
};

type KnockoutMatch = {
  stage: string;
  teamA: string | null;
  teamB: string | null;
};

type ScorePrediction = {
  teamAScore: number;
  teamBScore: number;
  predictedAdvancingTeam: string | null;
};

export function requiresAdvancingTeamPrediction(stage: string) {
  return ADVANCING_TEAM_PREDICTION_STAGES.has(stage as MatchStageValue);
}

export function mayEditChampionPrediction(
  openingMatch: OpeningMatch | null,
  now = new Date(),
) {
  return openingMatch !== null && !hasEffectivelyStarted(openingMatch, now);
}

export function mayRevealChampionPredictions(
  openingMatch: OpeningMatch | null,
  now = new Date(),
) {
  return openingMatch !== null && hasEffectivelyStarted(openingMatch, now);
}

export function officialChampionFromFinal(
  finalMatch: { status: string; advancingTeam: string | null } | null,
) {
  return finalMatch?.status === "FINISHED" ? finalMatch.advancingTeam : null;
}

export function championBonusPoints(
  predictedChampion: string | null,
  officialChampion: string | null,
) {
  return predictedChampion !== null && predictedChampion === officialChampion
    ? CHAMPION_BONUS_POINTS
    : 0;
}

export function advancingTeamPredictionForMatch(
  match: KnockoutMatch,
  prediction: ScorePrediction,
): { valid: boolean; value: string | null } {
  if (!requiresAdvancingTeamPrediction(match.stage)) {
    return { valid: true, value: null };
  }

  const selectedTeam = prediction.predictedAdvancingTeam;
  if (
    !match.teamA ||
    !match.teamB ||
    !selectedTeam ||
    (selectedTeam !== match.teamA && selectedTeam !== match.teamB)
  ) {
    return { valid: false, value: null };
  }

  if (prediction.teamAScore !== prediction.teamBScore) {
    const predictedWinner =
      prediction.teamAScore > prediction.teamBScore ? match.teamA : match.teamB;
    if (selectedTeam !== predictedWinner) {
      return { valid: false, value: null };
    }
  }

  return { valid: true, value: selectedTeam };
}

export function isCorrectAdvancingTeamPrediction(
  stage: string,
  predictedAdvancingTeam: string | null,
  advancingTeam: string | null,
) {
  return (
    requiresAdvancingTeamPrediction(stage) &&
    predictedAdvancingTeam !== null &&
    predictedAdvancingTeam === advancingTeam
  );
}
