import type { Metadata } from "next";
import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  ShieldCheck,
  Trophy,
  UsersRound,
} from "lucide-react";
import { signInWithKeycloak } from "@/app/actions/auth";
import { TournamentAccentBars, TournamentBackdrop } from "@/components/shared/tournament-theme";
import { Button } from "@/components/ui/button";
import { MessageAlert } from "@/components/shared/message-alert";

export const metadata: Metadata = {
  title: "Entrar | Bolão da Copa do Mundo",
};

const features = [
  {
    icon: ChartNoAxesColumnIncreasing,
    title: "Pontuação em tempo real",
    description: "Acompanhe sua posição a cada rodada.",
  },
  {
    icon: UsersRound,
    title: "Grupos de Amigos",
    description: "Compare palpites e dispute o topo.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-[#080b12] px-4 py-6 sm:px-6 lg:px-8">
      <TournamentBackdrop />
      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl shadow-black/50 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#0b1018] p-12 text-white lg:flex">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 flex w-16 gap-2 opacity-75"
          >
            <span className="h-56 w-1.5 rounded-full bg-[#e52c3f]" />
            <span className="mt-16 h-56 w-1.5 rounded-full bg-[#0e74e1]" />
            <span className="mt-32 h-56 w-1.5 rounded-full bg-[#099d57]" />
          </div>
          <div
            aria-hidden="true"
            className="absolute -left-16 bottom-28 size-64 rounded-full bg-[#0e74e1]/20 blur-3xl"
          />
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-16 flex-col items-center justify-center rounded-lg border border-white/15 bg-white text-[#080b12] shadow-lg shadow-black/20">
                <Trophy className="size-5" aria-hidden="true" />
                <span className="mt-1 text-2xl font-black leading-none tracking-tighter">26</span>
              </div>
              <div>
                <p className="text-lg font-bold uppercase tracking-tight">Bolão da Copa</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                  Mundial 2026
                </p>
              </div>
            </div>
            <p className="mt-14 max-w-md text-5xl font-black uppercase leading-[1.02] tracking-[-0.055em]">
              O mundo joga.
              <br />
              Você palpita.
            </p>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
              Preveja placares, some pontos e acompanhe a disputa com seus amigos
              durante toda a Copa do Mundo.
            </p>
          </div>

          <div className="relative mt-14">
            <p className="mb-7 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
              Canadá&nbsp;&nbsp; México&nbsp;&nbsp; Estados Unidos
            </p>
            <div className="space-y-5">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                    <Icon className="size-5 text-white" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-sm text-slate-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="login-title"
          className="flex flex-col justify-center bg-white px-6 py-8 sm:px-12 sm:py-12 lg:min-h-[650px] lg:px-16"
        >
          <div className="mb-10 flex items-center gap-3 text-sm font-semibold text-slate-950 lg:hidden">
            <span className="flex size-11 flex-col items-center justify-center rounded-md bg-[#080b12] text-white">
              <Trophy className="size-3.5" aria-hidden="true" />
              <span className="text-sm font-black leading-none">26</span>
            </span>
            <span className="uppercase tracking-wide">Bolão da Copa 2026</span>
          </div>
          <TournamentAccentBars className="mb-7" />
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Bem-vindo</p>
          <h1
            id="login-title"
            className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
          >
            Entre em campo
          </h1>
          <p id="login-description" className="mt-4 max-w-sm text-base leading-7 text-slate-600">
            Acesse sua conta para registrar palpites e disputar a Copa com seus amigos.
          </p>

          <div className="mt-8 space-y-5">
            <MessageAlert error={error} />
            <form action={signInWithKeycloak}>
              <Button
                aria-describedby="login-description login-security-note"
                className="group h-12 w-full rounded-xl bg-[#080b12] text-base shadow-sm shadow-slate-950/15 hover:bg-slate-800"
                type="submit"
              >
                Entrar com minha conta
                <ArrowRight
                  className="ml-2 size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Button>
            </form>
          </div>

          <div
            id="login-security-note"
            className="mt-8 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
          >
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#099d57]" aria-hidden="true" />
            <p className="text-sm leading-6 text-slate-600">
              Seu acesso é feito com autenticação segura. Você será direcionado para
              entrar e voltará ao bolão em seguida.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
