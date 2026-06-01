export const ERROR_MESSAGES = {
  session: "Sua sessão expirou. Entre novamente para continuar.",
  forbidden: "Sua conta do Keycloak não tem acesso a este bolão.",
  account: "Seu perfil não foi encontrado. Entre novamente.",
  admin: "É necessário acesso de administrador.",
  invalid_prediction: "Informe placares válidos entre 0 e 99.",
  invalid_advancing_team_prediction:
    "Selecione a equipe classificada compatível com o placar previsto.",
  match_not_found: "Jogo não encontrado.",
  predictions_closed: "As apostas deste jogo já estão encerradas.",
  participants_pending: "A aposta será liberada quando as duas equipes estiverem confirmadas.",
  invalid_favorite_team: "O time favorito deve ter até 80 caracteres.",
  invalid_predicted_champion: "Selecione uma equipe participante da Copa.",
  champion_prediction_closed:
    "O prazo para indicar o campeão encerrou no início do primeiro jogo.",
  invalid_friend_group: "Informe um nome de Grupo de Amigos com até 80 caracteres.",
  friend_group_not_found: "Grupo de Amigos não encontrado ou você não tem acesso a ele.",
  invite_invalid: "Este convite não existe mais ou foi desativado.",
  owner_cannot_leave: "O criador deve excluir o Grupo de Amigos em vez de sair dele.",
  invalid_member: "Participante não encontrado neste Grupo de Amigos.",
  invalid_result: "Confira o status, o placar e a equipe classificada.",
  unresolved_match: "Este confronto ainda não tem duas equipes definidas.",
  knockout_qualifier_required: "Selecione a equipe classificada após um empate eliminatório.",
  finished_match_locked: "Um jogo encerrado não pode voltar a um status anterior.",
  started_match_locked: "Um jogo ao vivo não pode voltar para agendado.",
  update_conflict: "Outra atualização ocorreu ao mesmo tempo. Tente novamente.",
  invalid_score_sync_settings: "Confira a configuração de sincronização de placares.",
  score_sync_failed: "A sincronização com o ESPN Scoreboard falhou. Tente novamente.",
  score_sync_locked: "Outra sincronização de placares está em andamento.",
  score_sync_no_matches: "Nenhum jogo está no horário de atualização automática.",
  score_sync_event_missing: "Este jogo ainda não tem um event ID da ESPN.",
  score_sync_match_not_started: "A sincronização de placar só pode iniciar após o horário do jogo.",
  score_sync_match_locked: "As atualizações automáticas estão bloqueadas para este jogo.",
  Configuration: "A autenticação não está configurada neste ambiente.",
  AccessDenied: "Seu papel no Keycloak não permite acesso a esta aplicação.",
} as const;

export const SUCCESS_MESSAGES = {
  prediction_saved: "Aposta salva.",
  favorite_team_updated: "Time favorito atualizado.",
  predicted_champion_updated: "Palpite de campeão salvo.",
  friend_group_created: "Grupo de Amigos criado.",
  friend_group_joined: "Você entrou no Grupo de Amigos.",
  friend_group_left: "Você saiu do Grupo de Amigos.",
  friend_group_deleted: "Grupo de Amigos excluído.",
  friend_group_member_removed: "Participante removido e convite anterior desativado.",
  friend_group_invite_disabled: "Convite desativado.",
  match_updated: "Resultado atualizado.",
  match_updated_predictions_reset:
    "Resultado atualizado. Apostas de confrontos futuros alterados foram removidas e devem ser refeitas.",
  match_updated_propagation_blocked:
    "Resultado atualizado. Um confronto dependente já começou ou passou do horário e não foi alterado automaticamente.",
  points_recalculated: "Pontuação recalculada para todos os jogos.",
  score_sync_settings_updated: "Configuração de sincronização de placares atualizada.",
  score_events_imported: "Eventos da ESPN importados.",
  score_sync_completed: "Sincronização de placares executada.",
  score_match_sync_completed: "Jogo atualizado pelo ESPN Scoreboard.",
  score_match_locked: "Atualizações automáticas bloqueadas para este jogo.",
  score_match_unlocked: "Atualizações automáticas liberadas para este jogo.",
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
