"use client";

import Link from "next/link";
import { MatchCard, type MatchCardMatch } from "@/components/matches/match-card";
import { useBrowserTimeZone } from "@/components/shared/browser-date-time";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { selectFocusedMatches } from "@/lib/match-focus";

type FocusedMatchesProps = {
  matches: MatchCardMatch[];
  title?: string;
  description?: string;
  scheduleLink: {
    href: string;
    label: string;
    scroll?: boolean;
  };
  referenceTime: Date;
};

export function FocusedMatches({
  matches,
  title = "Jogos em foco",
  description = "Acompanhe os jogos de hoje e os próximos confrontos sem percorrer a agenda completa.",
  scheduleLink,
  referenceTime,
}: FocusedMatchesProps) {
  const timeZone = useBrowserTimeZone();
  const focusedMatches = selectFocusedMatches(matches, referenceTime, timeZone);

  return (
    <section className="space-y-5" aria-labelledby="focused-matches-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="focused-matches-title" className="text-2xl font-semibold text-slate-950">
            {title}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            {description}
          </p>
        </div>
        <Link
          href={scheduleLink.href}
          scroll={scheduleLink.scroll}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {scheduleLink.label}
        </Link>
      </div>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5">
        <h3 className="text-lg font-semibold text-emerald-950">
          Jogos de hoje
        </h3>
        <p className="mt-1 text-sm text-emerald-900/80">
          Partidas do dia atual no horário do seu navegador.
        </p>
        <div className="mt-4">
          {focusedMatches.today.length > 0 ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {focusedMatches.today.map((match) => (
                <MatchCard key={match.id} match={match} highlighted />
              ))}
            </div>
          ) : (
            <EmptyFocusedMatches message="Nenhum jogo previsto para hoje." />
          )}
        </div>
      </section>

      <FocusedMatchGroup
        title="Próximos jogos"
        matches={focusedMatches.nextDay}
        emptyMessage="Não há próximos jogos agendados."
      />
    </section>
  );
}

function FocusedMatchGroup({
  title,
  matches,
  emptyMessage,
}: {
  title: string;
  matches: MatchCardMatch[];
  emptyMessage: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      {matches.length > 0 ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <EmptyFocusedMatches message={emptyMessage} />
      )}
    </section>
  );
}

function EmptyFocusedMatches({ message }: { message: string }) {
  return (
    <Card className="bg-white/85">
      <CardContent className="pt-5 text-sm text-slate-600">
        {message}
      </CardContent>
    </Card>
  );
}
