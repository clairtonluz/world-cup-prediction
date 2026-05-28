import Image from "next/image";
import { teamText } from "@/lib/display";
import { teamFlagPath } from "@/lib/team-flags";
import { cn } from "@/lib/utils";

export function TeamLabel({
  team,
  slot,
  className,
  textClassName,
}: {
  team: string | null;
  slot?: string | null;
  className?: string;
  textClassName?: string;
}) {
  const flagPath = teamFlagPath(team);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {flagPath ? (
        <Image
          src={flagPath}
          alt=""
          width={24}
          height={16}
          className="h-4 w-6 shrink-0 rounded-sm object-cover shadow-sm"
        />
      ) : null}
      <span className={textClassName}>{teamText(team, slot ?? null)}</span>
    </span>
  );
}
