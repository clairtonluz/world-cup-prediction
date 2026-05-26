"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { isAdmin } from "@/lib/authorization";
import type { AppRole } from "@/lib/authorization";

const navigationItems = [
  { href: "/matches", label: "Jogos" },
  { href: "/grupos", label: "Grupos" },
  { href: "/ranking", label: "Ranking" },
  { href: "/ligas", label: "Ligas" },
  { href: "/pontuacao", label: "Pontuação" },
  { href: "/me", label: "Minhas estatísticas" },
];

const navigationLinkClassName =
  "whitespace-nowrap rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1]";

export function MainNav({ roles }: { roles: AppRole[] }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const adminLink = isAdmin({ roles }) ? (
    <Link className={navigationLinkClassName} href="/admin/matches" onClick={closeMenu}>
      Administração
    </Link>
  ) : null;

  return (
    <>
      {/* Desktop Navigation */}
      <nav
        className="hidden items-center gap-1 text-sm text-slate-300 lg:flex"
        aria-label="Navegação principal (desktop)"
      >
        {navigationItems.map((item) => (
          <Link key={item.href} className={navigationLinkClassName} href={item.href}>
            {item.label}
          </Link>
        ))}
        {adminLink}
      </nav>

      {/* Mobile Toggle Button */}
      <div className="flex lg:hidden">
        <button
          onClick={toggleMenu}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1]"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay/Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 left-0 z-50 border-b border-white/20 bg-[#0a0e17] shadow-2xl shadow-black/50 px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Navegação principal (mobile)">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                className={`${navigationLinkClassName} block w-full text-base text-slate-200`}
                href={item.href}
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            ))}
            {adminLink && (
               <div className="mt-2 border-t border-white/10 pt-2">
                 <Link
                   className={`${navigationLinkClassName} block w-full text-base text-blue-400 font-medium`}
                   href="/admin/matches"
                   onClick={closeMenu}
                 >
                   Administração
                 </Link>
               </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
