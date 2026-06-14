"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, User, X } from "lucide-react";
import { signOutFromKeycloak } from "@/app/actions/auth";
import { isAdmin } from "@/lib/authorization";
import type { AppRole } from "@/lib/authorization";
import { cn } from "@/lib/utils";

interface NavigationItem {
  href: string;
  label: string;
  activePathPrefix?: string;
}

const navigationItems: NavigationItem[] = [
  { href: "/matches", label: "Jogos" },
  { href: "/apostas", label: "Minhas apostas" },
  { href: "/grupos", label: "Grupos" },
  { href: "/mata-mata", label: "Mata-mata" },
  { href: "/ranking", label: "Ranking" },
  { href: "/grupos-de-amigos", label: "Grupos de Amigos" },
  { href: "/pontuacao", label: "Pontuação" },
  { href: "/me", label: "Minhas estatísticas" },
];

const adminNavigationItem: NavigationItem = {
  href: "/admin/matches",
  label: "Administração",
  activePathPrefix: "/admin",
};

const navigationLinkClassName =
  "whitespace-nowrap rounded-lg px-3 py-2 font-medium transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1]";

function isActiveNavigationItem(pathname: string, item: NavigationItem) {
  const pathPrefix = item.activePathPrefix ?? item.href;

  return pathname === pathPrefix || pathname.startsWith(`${pathPrefix}/`);
}

function NavigationLink({
  item,
  pathname,
  isMobile = false,
  onClick,
}: {
  item: NavigationItem;
  pathname: string;
  isMobile?: boolean;
  onClick?: () => void;
}) {
  const isActive = isActiveNavigationItem(pathname, item);

  return (
    <Link
      className={cn(
        navigationLinkClassName,
        isMobile ? "block w-full text-base" : "text-sm",
        isActive ? "bg-white/15 text-white" : "text-slate-300",
      )}
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
    >
      {item.label}
    </Link>
  );
}

export function MainNav({ roles, name }: { roles: AppRole[]; name: string }) {
  const pathname = usePathname();
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const canAccessAdministration = isAdmin({ roles });

  const closeMenu = () => {
    setIsOpen(false);
    setIsUserMenuOpen(false);
  };

  useEffect(() => {
    if (!isOpen && !isUserMenuOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (isUserMenuOpen) {
        setIsUserMenuOpen(false);
        userMenuButtonRef.current?.focus();
        return;
      }

      setIsOpen(false);
      mobileMenuButtonRef.current?.focus();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, isUserMenuOpen]);

  return (
    <>
      <div className="hidden lg:relative lg:col-start-2 lg:row-start-1 lg:block">
        <button
          ref={userMenuButtonRef}
          type="button"
          onClick={() => {
            setIsOpen(false);
            setIsUserMenuOpen((isOpen) => !isOpen);
          }}
          className="flex max-w-64 items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1]"
          aria-controls="desktop-user-menu"
          aria-expanded={isUserMenuOpen}
          aria-label={`Opções da conta de ${name}`}
        >
          <User className="h-4 w-4 shrink-0" />
          <span className="max-w-48 truncate" title={name}>
            {name}
          </span>
        </button>

        {isUserMenuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              onClick={closeMenu}
              tabIndex={-1}
              aria-label="Fechar opções da conta"
            />
            <div
              id="desktop-user-menu"
              className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-white/10 bg-[#0a0e17] p-2 shadow-2xl shadow-black/50"
            >
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

      <nav
        className="hidden flex-wrap items-center gap-1 border-t border-white/10 pt-3 lg:col-span-2 lg:row-start-2 lg:flex"
        aria-label="Navegação principal"
      >
        {navigationItems.map((item) => (
          <NavigationLink key={item.href} item={item} pathname={pathname} />
        ))}
        {canAccessAdministration && (
          <NavigationLink item={adminNavigationItem} pathname={pathname} />
        )}
      </nav>

      <div className="col-start-2 row-start-1 flex lg:hidden">
        <button
          ref={mobileMenuButtonRef}
          type="button"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsOpen((isOpen) => !isOpen);
          }}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e74e1]"
          aria-controls="mobile-navigation-menu"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div
          id="mobile-navigation-menu"
          className="absolute right-0 left-0 top-full z-50 max-h-[calc(100vh-5rem)] overflow-y-auto border-b border-white/20 bg-[#0a0e17] px-4 py-4 shadow-2xl shadow-black/50 lg:hidden"
        >
          <div className="mb-4 border-b border-white/10 pb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Usuário</span>
            <div className="mt-2 flex items-center gap-2 text-slate-200">
              <User className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="break-words font-medium">{name}</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1" aria-label="Navegação principal">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Navegação</span>
            {navigationItems.map((item) => (
              <NavigationLink
                key={item.href}
                item={item}
                pathname={pathname}
                isMobile
                onClick={closeMenu}
              />
            ))}
            {canAccessAdministration && (
              <div className="mt-2 border-t border-white/10 pt-2">
                <NavigationLink
                  item={adminNavigationItem}
                  pathname={pathname}
                  isMobile
                  onClick={closeMenu}
                />
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
    </>
  );
}
