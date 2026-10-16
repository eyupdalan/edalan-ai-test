import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  accent,
  actions,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  accent?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className={`flex size-10 items-center justify-center rounded-xl ${accent}`}>
            <Icon className="size-5" />
          </span>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
  tour,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Senaryo (react-joyride) hedefi: data-tour değeri */
  tour?: string;
}) {
  return (
    <section data-tour={tour} className={`rounded-xl border border-border bg-surface ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const badgeTones = {
  green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  red: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  blue: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  gray: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
} as const;

export type BadgeTone = keyof typeof badgeTones;

export function Badge({ tone = "gray", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}
