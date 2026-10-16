"use client";

import { createContext, use } from "react";

import type { User } from "./users";

const UserContext = createContext<Promise<User> | null>(null);

export function UserProvider({
  userPromise,
  children,
}: {
  userPromise: Promise<User>;
  children: React.ReactNode;
}) {
  return <UserContext value={userPromise}>{children}</UserContext>;
}

/** İstemci bileşenlerinde oturumdaki kullanıcıya erişim. */
export function useUser(): User {
  const userPromise = use(UserContext);
  if (!userPromise) throw new Error("useUser, UserProvider içinde kullanılmalı.");
  return use(userPromise);
}
