import Link from "next/link";
import Image from "next/image";
import { teamText } from "@/lib/display";
import { teamFlagPath } from "@/lib/team-flags";
import { cn } from "@/lib/utils";

export function TeamLabel({
  team,
  slot,
  href,
  className,
  textClassName,
}: {
  team: string | null;
  slot?: string | null;
  href?: string | null;
  className?: string;
  textClassName?: string;
}) {
  const flagPath = teamFlagPath(team);
  const label = teamText(team, slot ?? null);
  const classNames = cn(
    "inline-flex items-center gap-2",
    href &&
      "rounded-md transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
    className,
  );
  const content = (
    <>
      {flagPath ? (
        <Image
          src={flagPath}
          alt=""
          width={24}
          height={16}
          className="h-4 w-6 shrink-0 rounded-sm object-cover shadow-sm"
        />
      ) : null}
      <span className={textClassName}>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classNames}>
        {content}
      </Link>
    );
  }

  return (
    <span className={classNames}>
      {content}
    </span>
  );
}
