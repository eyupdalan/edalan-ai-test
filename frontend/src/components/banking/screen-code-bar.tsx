"use client";

import { ChevronRight, CornerDownLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { ScenarioLauncher } from "@/components/tour/scenario-launcher";
import { findScreen, findScreenByPath } from "@/lib/banking/screens";

/** Bankacılık modülü üst çubuğu: konum bilgisi + ekran koduyla hızlı geçiş */
export function ScreenCodeBar() {
  const pathname = usePathname();
  const router = useRouter();
  const current = findScreenByPath(pathname);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  function go(e: React.FormEvent) {
    e.preventDefault();
    const screen = findScreen(code);
    if (!screen) return setError(true);
    setCode("");
    router.push(screen.href);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5 sm:px-6 lg:px-8">
      <nav className="flex min-w-0 items-center gap-1 text-sm">
        <Link href="/bankacilik" className="text-muted hover:text-foreground">
          Bankacılık
        </Link>
        {current && (
          <>
            <ChevronRight className="size-4 shrink-0 text-muted" />
            <span className="truncate font-medium">{current.title}</span>
          </>
        )}
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <ScenarioLauncher />
        <form onSubmit={go} className="flex items-center gap-2">
          <label htmlFor="screen-code" className="text-xs text-muted">
            Ekran kodu
          </label>
          <div
            className={`flex items-center rounded-lg border bg-background pr-1 ${
              error ? "border-rose-500" : "border-border focus-within:border-emerald-500"
            }`}
          >
            <input
              id="screen-code"
              data-tour="code-bar-input"
              value={code}
              maxLength={8}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(false);
              }}
              placeholder="KRTTBASV"
              aria-invalid={error}
              className="w-28 bg-transparent px-2 py-1.5 font-mono text-sm uppercase tracking-wider outline-none"
            />
            <button
              type="submit"
              data-tour="code-bar-submit"
              aria-label="Ekrana git"
              className="rounded-md p-1 text-muted hover:bg-surface-muted hover:text-foreground"
            >
              <CornerDownLeft className="size-4" />
            </button>
          </div>
          {error && (
            <span className="text-xs text-rose-600 dark:text-rose-400">Ekran bulunamadı</span>
          )}
        </form>
      </div>
    </div>
  );
}
