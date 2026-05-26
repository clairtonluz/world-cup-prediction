import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#0e74e1] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100",
        className,
      )}
      {...props}
    />
  );
}
