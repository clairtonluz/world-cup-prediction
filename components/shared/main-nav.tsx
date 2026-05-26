"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogOut, User } from "lucide-react";
import { isAdmin } from "@/lib/authorization";
import type { AppRole } from "@/lib/authorization";
import { signOutFromKeycloak } from "@/app/actions/auth";

const navigationItems = [
  { href: "/matches", label: "Jogos" },
  { href: "/grupos", label: "Grupos" },
  { href: "/ranking", label: "Ranking" },
  { href: "/grupos-de-amigos", label: "Grupos de Amigos" },
  { href: "/pontuacao", label: "Pontuação" },
  { href: "/me", label: "Minhas estatísticas" },
];

const navigationLinkClassName =
  "whitespace-nowrap rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1]";

export function MainNav({ roles, name }: { roles: AppRole[]; name: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => {
    setIsOpen(false);
    setIsUserMenuOpen(false);
  };

  const adminLink = isAdmin({ roles }) ? (
    <Link className={navigationLinkClassName} href="/admin/matches" onClick={closeMenu}>
      Administração
    </Link>
  ) : null;

  return (
    <div className="flex items-center gap-2 lg:gap-8">
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

      {/* Desktop User Dropdown */}
      <div className="hidden lg:relative lg:block">
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1]"
        >
          <User className="h-4 w-4" />
          <span>{name}</span>
        </button>

        {isUserMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeMenu} />
            <div className="absolute right-0 mt-2 z-50 w-48 rounded-xl border border-white/10 bg-[#0a0e17] p-2 shadow-2xl shadow-black/50">
              <form action={signOutFromKeycloak}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </form>
            </div>
          </>
        )}
      </div>

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
          <div className="mb-4 border-b border-white/10 pb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Usuário</span>
            <div className="mt-2 flex items-center gap-2 text-slate-200">
              <User className="h-4 w-4 text-slate-400" />
              <span className="font-medium">{name}</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1" aria-label="Navegação principal (mobile)">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Navegação</span>
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
            
            <div className="mt-4 border-t border-white/10 pt-4">
              <form action={signOutFromKeycloak}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-base text-red-400 hover:bg-red-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </button>
              </form>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
