import Link from "next/link";
import { cn } from "@/lib/utils";

export function PlayerScoreLink({
  playerId,
  name,
  className,
}: {
  playerId: string;
  name: string;
  className?: string;
}) {
  return (
    <Link
      href={`/jogadores/${playerId}`}
      className={cn(
        "font-medium text-emerald-700 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
        className,
      )}
      title={name}
      aria-label={`Ver pontuação de ${name}`}
    >
      {name}
    </Link>
  );
}
