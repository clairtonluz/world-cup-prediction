"use client";

import { Input } from "@/components/ui/input";

export function InviteLinkResult({ path }: { path: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor="inviteLink" className="block text-sm font-medium text-slate-700">
        Link de convite
      </label>
      <Input id="inviteLink" value={path} readOnly />
      <p className="text-xs text-slate-600">
        Compartilhe apenas com amigos convidados. Um novo link invalida o anterior.
      </p>
    </div>
  );
}
