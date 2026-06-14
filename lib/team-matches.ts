const TEAM_QUERY_MAX_LENGTH = 80;

export function parseTeamSearchParam(
  value: string | string[] | undefined,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const team = value.trim();
  if (!team || team.length > TEAM_QUERY_MAX_LENGTH) {
    return null;
  }

  return team;
}

export function teamMatchesHref(team: string | null | undefined) {
  const selectedTeam = parseTeamSearchParam(team ?? undefined);
  if (!selectedTeam) {
    return null;
  }

  const searchParams = new URLSearchParams({ team: selectedTeam });
  return `/matches?${searchParams.toString()}`;
}
