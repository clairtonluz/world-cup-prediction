import type { MatchStatusValue } from "@/lib/constants";

export type GroupCodeValue =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

export const GROUP_CODES: GroupCodeValue[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

export type StandingsMatch = {
  teamA: string | null;
  teamB: string | null;
  status: MatchStatusValue;
  teamAScore: number | null;
  teamBScore: number | null;
};

export type StandingRow = {
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  performance: number;
};

export function hasRecordedScore(match: StandingsMatch) {
  return (
    match.status !== "SCHEDULED" &&
    match.teamAScore !== null &&
    match.teamBScore !== null
  );
}

export function hasProvisionalScore(matches: StandingsMatch[]) {
  return matches.some(
    (match) =>
      match.status === "STARTED" &&
      match.teamAScore !== null &&
      match.teamBScore !== null,
  );
}

export function compareStandingRows(a: StandingRow, b: StandingRow) {
  return (
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.team.localeCompare(b.team, "pt-BR", { sensitivity: "base" })
  );
}

export function calculateGroupStandings(matches: StandingsMatch[]) {
  const teams = new Map<string, StandingRow>();

  for (const match of matches) {
    for (const team of [match.teamA, match.teamB]) {
      if (team && !teams.has(team)) {
        teams.set(team, emptyStanding(team));
      }
    }

    if (
      !hasRecordedScore(match) ||
      !match.teamA ||
      !match.teamB ||
      match.teamAScore === null ||
      match.teamBScore === null
    ) {
      continue;
    }

    const teamA = teams.get(match.teamA)!;
    const teamB = teams.get(match.teamB)!;
    teamA.played += 1;
    teamB.played += 1;
    teamA.goalsFor += match.teamAScore;
    teamA.goalsAgainst += match.teamBScore;
    teamB.goalsFor += match.teamBScore;
    teamB.goalsAgainst += match.teamAScore;

    if (match.teamAScore === match.teamBScore) {
      teamA.draws += 1;
      teamB.draws += 1;
      teamA.points += 1;
      teamB.points += 1;
    } else if (match.teamAScore > match.teamBScore) {
      teamA.wins += 1;
      teamB.losses += 1;
      teamA.points += 3;
    } else {
      teamB.wins += 1;
      teamA.losses += 1;
      teamB.points += 3;
    }
  }

  return [...teams.values()]
    .map((standing) => ({
      ...standing,
      goalDifference: standing.goalsFor - standing.goalsAgainst,
      performance:
        standing.played === 0
          ? 0
          : Math.round((standing.points / (standing.played * 3)) * 100),
    }))
    .sort(compareStandingRows);
}

function emptyStanding(team: string): StandingRow {
  return {
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    performance: 0,
  };
}
