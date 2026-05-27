import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  ShieldCheck,
  Trophy,
  UsersRound,
} from "lucide-react";
import { signInWithKeycloak } from "@/app/actions/auth";
import {
  TournamentAccentBars,
  TournamentBackdrop,
  TournamentBrand,
} from "@/components/shared/tournament-theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const benefits = [
  {
    icon: Trophy,
    title: "Palpites antes do jogo",
    description:
      "Registre seus placares antes do apito inicial e acompanhe toda a agenda oficial.",
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: "Pontuação transparente",
    description:
      "Veja seus acertos, sua posição e as regras de pontuação com clareza.",
  },
  {
    icon: UsersRound,
    title: "Disputa com amigos",
    description:
      "Crie Grupos de Amigos privados e acompanhe quem entende mais de Copa.",
  },
] as const;

const steps = [
  {
    title: "Entre com sua conta",
    description: "Use seu acesso seguro para participar do bolão.",
  },
  {
    title: "Dê seus palpites",
    description: "Preveja placares e o campeão antes dos prazos.",
  },
  {
    title: "Acompanhe o ranking",
    description: "Compare pontos e evolução durante o Mundial.",
  },
] as const;

const rules = [
  "Agenda oficial da Copa do Mundo 2026 com 104 jogos.",
  "Apostas encerradas automaticamente no início de cada partida.",
  "Autenticação segura para manter sua disputa privada.",
] as const;

function SignInButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form action={signInWithKeycloak}>
      <Button
        type="submit"
        className={cn(
          "group gap-2 rounded-xl bg-white text-[#080b12] shadow-lg shadow-black/20 hover:bg-slate-100",
          className,
        )}
      >
        {children}
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Button>
    </form>
  );
}

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080b12] text-white">
      <TournamentBackdrop />

      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-4 py-5 sm:px-6">
          <TournamentBrand />
          <SignInButton className="h-10 px-4 text-sm sm:px-5">Entrar</SignInButton>
        </div>
      </header>

      <main className="relative z-10">
        <section
          aria-labelledby="landing-title"
          className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pb-20 lg:pt-20"
        >
          <div>
            <TournamentAccentBars className="mb-8" />
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-300">
              Bolão privado - Mundial 2026
            </p>
            <h1
              id="landing-title"
              className="mt-5 max-w-2xl text-4xl font-black uppercase leading-[1.04] tracking-[-0.05em] text-white sm:text-6xl"
            >
              Palpite. Pontue. Dispute a Copa com amigos.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Entre no bolão, registre placares dos jogos oficiais e acompanhe sua
              posição no ranking durante toda a Copa do Mundo 2026.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <SignInButton className="h-12 w-full px-7 text-base sm:w-auto">
                Entrar no bolão
              </SignInButton>
              <a
                href="#como-funciona"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 px-7 text-base font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b12]"
              >
                Como funciona
              </a>
            </div>
          </div>

          <aside
            aria-label="Prévia ilustrativa da experiência no bolão"
            className="relative rounded-3xl border border-white/10 bg-white/[0.07] p-3 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-5"
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-950 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Prévia ilustrativa
                  </p>
                  <p className="mt-2 text-lg font-semibold">Meus jogos</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Palpite aberto
                </span>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex justify-between gap-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <span>Fase de grupos</span>
                  <span>12:00</span>
                </div>
                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
                  <p className="font-semibold">Seleção A</p>
                  <span className="rounded-lg bg-slate-950 px-3 py-2 text-lg font-bold text-white">
                    2 x 1
                  </span>
                  <p className="font-semibold">Seleção B</p>
                </div>
                <p className="mt-4 text-center text-sm text-emerald-700">Palpite salvo</p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Ranking do grupo</p>
                  <span className="text-xs text-slate-500">Exemplo</span>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 font-medium text-[#0756ac]">
                    <span>#1 Você</span>
                    <span>126 pts</span>
                  </div>
                  <div className="flex items-center justify-between px-3 text-slate-600">
                    <span>#2 Amigo</span>
                    <span>118 pts</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section
          aria-labelledby="benefits-title"
          className="border-y border-white/10 bg-white/[0.03]"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 id="benefits-title" className="sr-only">
              Benefícios do bolão
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {benefits.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-white/10">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="como-funciona"
          aria-labelledby="how-title"
          className="mx-auto max-w-6xl scroll-mt-6 px-4 py-16 sm:px-6 lg:py-20"
        >
          <div className="max-w-xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-400">
              Como funciona
            </p>
            <h2 id="how-title" className="mt-3 text-3xl font-bold tracking-tight">
              Três passos para jogar
            </h2>
          </div>
          <ol className="mt-10 grid gap-6 lg:grid-cols-3">
            {steps.map(({ title, description }, index) => (
              <li key={title} className="flex gap-5 rounded-2xl border border-white/10 p-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#080b12]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-20">
          <div className="grid gap-8 rounded-3xl border border-white/10 bg-white p-6 text-slate-950 sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-[#087d48]">
                <ShieldCheck className="size-6" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-2xl font-bold tracking-tight">
                Uma disputa justa e segura
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                As regras mantêm os palpites privados até a hora certa e cada
                participante acessa o bolão com sua própria conta.
              </p>
            </div>
            <ul className="space-y-3">
              {rules.map((rule) => (
                <li
                  key={rule}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-[#099d57]"
                  />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-16 text-center sm:px-6 lg:pb-20">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pronto para dar seus palpites?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300">
            Entre com sua conta e participe da disputa privada da Copa do Mundo
            2026.
          </p>
          <div className="mt-8 flex justify-center">
            <SignInButton className="h-12 px-8 text-base">Entrar no bolão</SignInButton>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-4 py-6 text-center text-sm text-slate-400 sm:px-6">
        Bolão da Copa do Mundo 2026
      </footer>
    </div>
  );
}
