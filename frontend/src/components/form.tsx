import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 read-only:bg-surface-muted";

export function Field({
  label,
  hint,
  className = "",
  tour,
  children,
}: {
  label: string;
  hint?: ReactNode;
  className?: string;
  /** Senaryo (react-joyride) hedefi: data-tour değeri */
  tour?: string;
  children: ReactNode;
}) {
  return (
    <label data-tour={tour} className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="text-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Checkbox({
  name,
  label,
  required,
  defaultChecked,
  tour,
}: {
  name: string;
  label: ReactNode;
  required?: boolean;
  defaultChecked?: boolean;
  tour?: string;
}) {
  return (
    <label data-tour={tour} className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        required={required}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 accent-emerald-600"
      />
      <span>{label}</span>
    </label>
  );
}

const buttonVariants = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-700",
  secondary: "border border-border bg-surface hover:bg-surface-muted",
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants }) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${buttonVariants[variant]} ${className}`}
    />
  );
}

/** İşlem sonucu / dekont kutusu */
export function ResultPanel({
  tone = "success",
  title,
  rows,
  tour,
  children,
}: {
  tone?: "success" | "error" | "info";
  title: string;
  rows?: { label: string; value: ReactNode }[];
  tour?: string;
  children?: ReactNode;
}) {
  const tones = {
    success: "border-emerald-500/30 bg-emerald-500/5",
    error: "border-rose-500/30 bg-rose-500/5",
    info: "border-sky-500/30 bg-sky-500/5",
  };
  return (
    <div data-tour={tour} className={`rounded-xl border p-5 ${tones[tone]}`}>
      <p className="font-semibold">{title}</p>
      {rows && (
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4 sm:block">
              <dt className="text-xs text-muted">{r.label}</dt>
              <dd className="font-medium tabular-nums">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
