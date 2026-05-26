import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-4">
      <h1 className="text-3xl font-semibold text-slate-950">Jogo não encontrado</h1>
      <p className="text-slate-600">O jogo solicitado não existe.</p>
      <Link href="/matches" className="font-medium text-emerald-700 hover:underline">
        Voltar para jogos
      </Link>
    </main>
  );
}
