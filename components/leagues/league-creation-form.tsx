"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createLeagueAction, type LeagueInviteState } from "@/actions/league-actions";
import { InviteLinkResult } from "@/components/leagues/invite-link-result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/feedback";

const initialState: LeagueInviteState = {};

export function LeagueCreationForm() {
  const [state, action, pending] = useActionState(createLeagueAction, initialState);

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="leagueName">Nome da liga</Label>
          <Input
            id="leagueName"
            name="name"
            placeholder="Amigos da Copa"
            maxLength={80}
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar liga"}
        </Button>
      </form>
      {state.error ? (
        <p role="status" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {ERROR_MESSAGES[state.error]}
        </p>
      ) : null}
      {state.success && state.invitePath && state.leagueId ? (
        <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p role="status" className="text-sm font-medium text-emerald-900">
            {SUCCESS_MESSAGES[state.success]} Compartilhe o convite abaixo.
          </p>
          <InviteLinkResult path={state.invitePath} />
          <Link href={`/ligas/${state.leagueId}`} className="block text-sm font-medium text-emerald-800 hover:underline">
            Abrir ranking da liga
          </Link>
        </div>
      ) : null}
    </div>
  );
}
