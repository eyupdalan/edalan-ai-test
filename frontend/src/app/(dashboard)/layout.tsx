import { Suspense } from "react";

import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth/session";
import { UserProvider } from "@/lib/auth/user-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Oturum istek anında okunduğu için (cookie) kullanıcıya bağlı her şey Suspense içinde.
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const userPromise = requireUser();

  return (
    <UserProvider userPromise={userPromise}>
      <div className="min-h-screen lg:flex">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </UserProvider>
  );
}
