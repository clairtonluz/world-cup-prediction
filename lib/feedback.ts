export const ERROR_MESSAGES = {
  session: "Your session expired. Sign in again to continue.",
  forbidden: "Your Keycloak account does not have access to this pool.",
  account: "Your participant profile could not be found. Sign in again.",
  admin: "Administrator access is required.",
  invalid_prediction: "Enter valid scores between 0 and 99.",
  match_not_found: "Match not found.",
  predictions_closed: "Predictions are closed for this match.",
  invalid_favorite_team: "Favorite team must be 80 characters or fewer.",
  invalid_match: "Check teams, kickoff, status, and final scores.",
  new_match_must_be_scheduled: "A new match must begin as scheduled.",
  fixture_locked: "Teams, stage, and kickoff cannot change after predictions close.",
  finished_match_locked: "Finished matches cannot be reopened.",
  started_match_locked: "Started matches cannot return to scheduled.",
  update_conflict: "Another update happened at the same time. Try again.",
  Configuration: "Authentication is not configured on this environment.",
  AccessDenied: "Your Keycloak role does not allow access to this application.",
} as const;

export const SUCCESS_MESSAGES = {
  prediction_saved: "Prediction saved.",
  favorite_team_updated: "Favorite team updated.",
  match_created: "Match created.",
  match_updated: "Match updated.",
} as const;

export type ErrorFeedbackCode = keyof typeof ERROR_MESSAGES;
export type SuccessFeedbackCode = keyof typeof SUCCESS_MESSAGES;

export type FeedbackParams = {
  error?: string;
  success?: string;
};

export function feedbackText({ error, success }: FeedbackParams) {
  if (error && error in ERROR_MESSAGES) {
    return { kind: "error" as const, text: ERROR_MESSAGES[error as ErrorFeedbackCode] };
  }

  if (success && success in SUCCESS_MESSAGES) {
    return {
      kind: "success" as const,
      text: SUCCESS_MESSAGES[success as SuccessFeedbackCode],
    };
  }

  return null;
}

export function feedbackUrl(
  pathname: string,
  feedback: { error: ErrorFeedbackCode } | { success: SuccessFeedbackCode },
) {
  return `${pathname}?${new URLSearchParams(feedback).toString()}`;
}
