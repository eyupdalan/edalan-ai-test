"use client";

import { Play, Square, Theater } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Badge, type BadgeTone } from "@/components/ui";
import { findScreenByPath } from "@/lib/banking/screens";
import { type ScenarioOutcome, scenarios } from "@/lib/tour/scenarios";

import { useScenarios } from "./scenario-provider";

const outcomeBadge: Record<ScenarioOutcome, { tone: BadgeTone; label: string }> = {
  success: { tone: "green", label: "Başarılı" },
  rejected: { tone: "red", label: "Ret" },
  info: { tone: "blue", label: "Bilgi" },
};

export function ScenarioLauncher() {
  const pathname = usePathname();
  const { active, autoplay, setAutoplay, start, stop } = useScenarios();
  const [open, setOpen] = useState(false);

  const currentCode = findScreenByPath(pathname)?.code;
  // Mevcut ekranın senaryoları en üstte
  const sorted = [...scenarios].sort(
    (a, b) => Number(b.screen === currentCode) - Number(a.screen === currentCode),
  );

  if (active) {
    return (
      <button
        type="button"
        onClick={stop}
        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
      >
        <Square className="size-3 fill-current" /> {active.title}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-muted"
      >
        <Theater className="size-3.5" /> Senaryolar
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Kapat"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-[min(380px,calc(100vw-32px))] rounded-xl border border-border bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <p className="text-sm font-semibold">Senaryo simülasyonu</p>
              <label className="flex items-center gap-1.5 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={autoplay}
                  onChange={(e) => setAutoplay(e.target.checked)}
                  className="size-3.5 accent-emerald-600"
                />
                Otomatik oynat
              </label>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-1.5">
              {sorted.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      start(s.id);
                    }}
                    className="group flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-surface-muted"
                  >
                    <Play className="mt-0.5 size-3.5 shrink-0 text-muted group-hover:text-emerald-600" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium">{s.title}</span>
                        <Badge tone={outcomeBadge[s.outcome].tone}>{outcomeBadge[s.outcome].label}</Badge>
                      </span>
                      <span className="block text-xs text-muted">{s.description}</span>
                    </span>
                    <span className="font-mono text-[10px] text-muted">{s.screen ?? "Genel"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
