"use server";

import { redirect } from "next/navigation";

import { createSession, deleteSession } from "./session";
import { verifyCredentials } from "./users";

export type LoginState = { error?: string; username?: string } | undefined;

function safeRedirectPath(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = verifyCredentials(username, password);
  if (!user) return { error: "Kullanıcı adı veya şifre hatalı.", username };

  await createSession(user.id);
  redirect(safeRedirectPath(formData.get("from")));
}

export async function logout() {
  await deleteSession();
  redirect("/giris");
}
