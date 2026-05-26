"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createFriendGroupAction, type FriendGroupInviteState } from "@/actions/friend-group-actions";
import { InviteLinkResult } from "@/components/friend-groups/invite-link-result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/feedback";

const initialState: FriendGroupInviteState = {};

export function FriendGroupCreationForm() {
  const [state, action, pending] = useActionState(createFriendGroupAction, initialState);

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="friendGroupName">Nome do Grupo de Amigos</Label>
          <Input
            id="friendGroupName"
            name="name"
            placeholder="Amigos da Copa"
            maxLength={80}
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar Grupo de Amigos"}
        </Button>
      </form>
      {state.error ? (
        <p role="status" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {ERROR_MESSAGES[state.error]}
        </p>
      ) : null}
      {state.success && state.invitePath && state.friendGroupId ? (
        <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p role="status" className="text-sm font-medium text-emerald-900">
            {SUCCESS_MESSAGES[state.success]} Compartilhe o convite abaixo.
          </p>
          <InviteLinkResult path={state.invitePath} />
          <Link href={`/grupos-de-amigos/${state.friendGroupId}`} className="block text-sm font-medium text-emerald-800 hover:underline">
            Abrir ranking do Grupo de Amigos
          </Link>
        </div>
      ) : null}
    </div>
  );
}
