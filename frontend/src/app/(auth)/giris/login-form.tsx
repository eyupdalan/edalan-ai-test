"use client";

import { useActionState, useState } from "react";

import { login } from "@/lib/auth/actions";
import { getInitials } from "@/lib/auth/format";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40";

type DemoUser = { username: string; name: string; role: string };

export function LoginForm({
  from,
  demoUsers,
  demoPassword,
}: {
  from?: string;
  demoUsers: DemoUser[];
  demoPassword: string;
}) {
  const [state, action, pending] = useActionState(login, undefined);
  const [username, setUsername] = useState(state?.username ?? "");
  const [password, setPassword] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <input type="hidden" name="from" value={from ?? "/"} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Kullanıcı adı</span>
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Şifre</span>
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </label>
        {state?.error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-400">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>

      <div className="rounded-xl border border-dashed border-border p-4">
        <p className="text-xs font-medium text-muted">
          Demo kullanıcılar · şifre: <code className="font-mono">{demoPassword}</code>
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          {demoUsers.map((u) => (
            <li key={u.username}>
              <button
                type="button"
                onClick={() => {
                  setUsername(u.username);
                  setPassword(demoPassword);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-muted"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold">
                  {getInitials(u.name)}
                </span>
                <span className="flex-1">
                  {u.name} <span className="text-muted">· {u.username}</span>
                </span>
                <span className="text-xs text-muted">{u.role}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
