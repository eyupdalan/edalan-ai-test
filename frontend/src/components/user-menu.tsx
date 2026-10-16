"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";

import { logout } from "@/lib/auth/actions";
import { getInitials } from "@/lib/auth/format";
import { useUser } from "@/lib/auth/user-context";

export function UserAvatar({ className = "size-8 text-xs" }: { className?: string }) {
  const user = useUser();
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-foreground font-semibold text-background ${className}`}
    >
      {getInitials(user.name)}
    </span>
  );
}

export function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const user = useUser();

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border p-2">
      <Link
        href="/profil"
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 hover:bg-surface-muted"
      >
        <UserAvatar />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.role}</p>
        </div>
      </Link>
      <form action={logout}>
        <button
          type="submit"
          aria-label="Çıkış yap"
          title="Çıkış yap"
          className="rounded-md p-2 text-muted hover:bg-surface-muted hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}
