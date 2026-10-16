"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { navItems } from "@/lib/modules";

import { UserAvatar, UserMenu } from "./user-menu";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ href, label, icon: Icon, accent, children }) => {
        const active = isActive(pathname, href);
        return (
          <div key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-surface-muted text-foreground"
                  : "text-muted hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <span className={`flex size-7 items-center justify-center rounded-md ${accent}`}>
                <Icon className="size-4" />
              </span>
              {label}
            </Link>
            {active && children && (
              <ul className="mt-1 ml-[1.375rem] flex flex-col border-l border-border pl-3">
                {children.map((child) => (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      onClick={onNavigate}
                      className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                        pathname === child.href
                          ? "bg-surface-muted font-medium text-foreground"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      <span className="truncate">{child.label}</span>
                      <span className="font-mono text-[10px] opacity-70">{child.code}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-3">
      <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-sm font-bold text-background">
        D
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">Dalan Platform</p>
        <p className="text-xs text-muted">Kontrol Paneli</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobil üst bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <UserAvatar className="size-7 text-[10px]" />
          <button
            type="button"
            aria-label="Menüyü aç"
            onClick={() => setOpen(true)}
            className="rounded-md p-2 text-muted hover:bg-surface-muted"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {/* Mobil çekmece */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Menüyü kapat"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col gap-6 border-r border-border bg-surface p-3 py-4">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                aria-label="Menüyü kapat"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-muted hover:bg-surface-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-auto">
              <UserMenu onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* Masaüstü yan menü */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface p-3 py-4 lg:flex">
        <Brand />
        <NavLinks />
        <div className="mt-auto">
          <UserMenu />
        </div>
      </aside>
    </>
  );
}
