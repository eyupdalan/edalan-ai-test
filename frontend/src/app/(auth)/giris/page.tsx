import type { Metadata } from "next";
import { Suspense } from "react";

import { DEMO_PASSWORD, listDemoUsers } from "@/lib/auth/users";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Giriş" };

export default function LoginPage({ searchParams }: PageProps<"/giris">) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-foreground text-lg font-bold text-background">
            D
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Dalan Platform</h1>
          <p className="text-sm text-muted">Devam etmek için giriş yapın</p>
        </div>
        <Suspense>
          <LoginFormWithRedirect searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function LoginFormWithRedirect({ searchParams }: Pick<PageProps<"/giris">, "searchParams">) {
  const { from } = await searchParams;
  return (
    <LoginForm
      from={typeof from === "string" ? from : undefined}
      demoUsers={listDemoUsers()}
      demoPassword={DEMO_PASSWORD}
    />
  );
}
