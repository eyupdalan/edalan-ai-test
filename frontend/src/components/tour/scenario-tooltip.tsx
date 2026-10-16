"use client";

import { X } from "lucide-react";
import type { TooltipRenderProps } from "react-joyride";

/** Joyride tooltip'i: projenin teması (açık/koyu) ile uyumlu */
export function ScenarioTooltip({
  index,
  size,
  isLastStep,
  step,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  const progress = ((index + 1) / size) * 100;

  return (
    <div
      {...tooltipProps}
      className="w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-xl border border-border bg-surface text-foreground shadow-xl"
    >
      <div className="h-1 bg-surface-muted">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Adım {index + 1} / {size}
            </p>
            {step.title && <h3 className="mt-0.5 font-semibold">{step.title}</h3>}
          </div>
          <button
            {...skipProps}
            aria-label="Senaryoyu bitir"
            title="Senaryoyu bitir"
            className="rounded-md p-1 text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-2 text-sm leading-relaxed text-muted">{step.content}</div>
        <div className="mt-4 flex justify-end">
          <button
            {...primaryProps}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {isLastStep ? "Bitir" : "İleri"}
          </button>
        </div>
      </div>
    </div>
  );
}
