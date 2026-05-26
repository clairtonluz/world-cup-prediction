"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin/matches", label: "Jogos" },
  { href: "/admin/users", label: "Usuários" },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 border-b border-slate-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors",
                isActive
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
