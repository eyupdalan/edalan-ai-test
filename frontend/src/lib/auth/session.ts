import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { findUserById, type User } from "./users";

export const SESSION_COOKIE = "session";

/** Oturumdaki kullanıcıyı döner; istek başına bir kez okunur. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const userId = (await cookies()).get(SESSION_COOKIE)?.value;
  return findUserById(userId);
});

/** Oturum yoksa giriş sayfasına yönlendirir. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  return user;
}

export async function createSession(userId: string) {
  // Sahte oturum: cookie'de yalnızca kullanıcı id'si tutulur (imzasız).
  (await cookies()).set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
