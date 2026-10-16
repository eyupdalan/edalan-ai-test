import { bankingModules, getScreen, screenTypeLabel } from "@/lib/banking/screens";

export function ScreenCode({ code }: { code: string }) {
  return (
    <span className="rounded-md border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-xs font-medium tracking-wider">
      {code}
    </span>
  );
}

export function ScreenHeader({ code }: { code: string }) {
  const screen = getScreen(code);
  const { name, icon: Icon } = bankingModules[screen.module];

  return (
    <div className="mb-6 flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Icon className="size-5" />
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{screen.title}</h1>
          <ScreenCode code={screen.code} />
        </div>
        <p className="text-sm text-muted">
          {name} · {screenTypeLabel[screen.type]} · {screen.description}
        </p>
      </div>
    </div>
  );
}
