export const ERROR_MESSAGES = {
  session: "Sua sessão expirou. Entre novamente para continuar.",
  forbidden: "Sua conta do Keycloak não tem acesso a este bolão.",
  account: "Seu perfil não foi encontrado. Entre novamente.",
  admin: "É necessário acesso de administrador.",
  invalid_prediction: "Informe placares válidos entre 0 e 99.",
  match_not_found: "Jogo não encontrado.",
  predictions_closed: "As apostas deste jogo já estão encerradas.",
  participants_pending: "A aposta será liberada quando as duas equipes estiverem confirmadas.",
  invalid_favorite_team: "O time favorito deve ter até 80 caracteres.",
  invalid_league: "Informe um nome de liga com até 80 caracteres.",
  league_not_found: "Liga não encontrada ou você não tem acesso a ela.",
  invite_invalid: "Este convite não existe mais ou foi desativado.",
  owner_cannot_leave: "O criador deve excluir a liga em vez de sair dela.",
  invalid_member: "Participante não encontrado nesta liga.",
  invalid_result: "Confira o status, o placar e a equipe classificada.",
  unresolved_match: "Este confronto ainda não tem duas equipes definidas.",
  knockout_qualifier_required: "Selecione a equipe classificada após um empate eliminatório.",
  finished_match_locked: "Um jogo encerrado não pode voltar a um status anterior.",
  started_match_locked: "Um jogo ao vivo não pode voltar para agendado.",
  update_conflict: "Outra atualização ocorreu ao mesmo tempo. Tente novamente.",
  Configuration: "A autenticação não está configurada neste ambiente.",
  AccessDenied: "Seu papel no Keycloak não permite acesso a esta aplicação.",
} as const;

export const SUCCESS_MESSAGES = {
  prediction_saved: "Aposta salva.",
  favorite_team_updated: "Time favorito atualizado.",
  league_created: "Liga criada.",
  league_joined: "Você entrou na liga.",
  league_left: "Você saiu da liga.",
  league_deleted: "Liga excluída.",
  league_member_removed: "Participante removido e convite anterior desativado.",
  league_invite_disabled: "Convite desativado.",
  match_updated: "Resultado atualizado.",
  match_updated_predictions_reset:
    "Resultado atualizado. Apostas de confrontos futuros alterados foram removidas e devem ser refeitas.",
  match_updated_propagation_blocked:
    "Resultado atualizado. Um confronto dependente já começou ou passou do horário e não foi alterado automaticamente.",
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
