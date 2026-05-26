"use client";

import { useActionState } from "react";
import {
  rotateFriendGroupInviteAction,
  type FriendGroupInviteState,
} from "@/actions/friend-group-actions";
import { InviteLinkResult } from "@/components/friend-groups/invite-link-result";
import { Button } from "@/components/ui/button";
import { ERROR_MESSAGES } from "@/lib/feedback";

export function InviteControls({
  friendGroupId,
  invitationEnabled,
}: {
  friendGroupId: string;
  invitationEnabled: boolean;
}) {
  const rotateAction = rotateFriendGroupInviteAction.bind(null, friendGroupId);
  const [state, action, pending] = useActionState<FriendGroupInviteState, FormData>(
    rotateAction,
    {},
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Convite: <strong>{invitationEnabled ? "ativo" : "desativado"}</strong>.
        Links são reutilizáveis até serem substituídos ou desativados.
      </p>
      <form action={action}>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Gerando..." : invitationEnabled ? "Gerar novo link" : "Ativar convite"}
        </Button>
      </form>
      {state.error ? (
        <p role="status" className="text-sm text-red-700">{ERROR_MESSAGES[state.error]}</p>
      ) : null}
      {state.invitePath ? <InviteLinkResult path={state.invitePath} /> : null}
    </div>
  );
}
