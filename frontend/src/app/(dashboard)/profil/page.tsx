import type { Metadata } from "next";

import { Badge, Card, PageHeader } from "@/components/ui";
import { getInitials } from "@/lib/auth/format";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const user = await requireUser();

  const fields = [
    { label: "Kullanıcı adı", value: user.username },
    { label: "E-posta", value: user.email },
    { label: "Telefon", value: user.phone },
    { label: "Departman", value: user.department },
    { label: "Müşteri no", value: user.customerNo },
    {
      label: "Katılım tarihi",
      value: new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(new Date(user.joinedAt)),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <PageHeader title="Profil" description="Oturum açan kullanıcının bilgileri" />

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-foreground text-xl font-semibold text-background">
            {getInitials(user.name)}
          </span>
          <div>
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <p className="text-sm text-muted">{user.title}</p>
            <div className="mt-1">
              <Badge tone="blue">{user.role}</Badge>
            </div>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-xs text-muted">{f.label}</dt>
              <dd className="text-sm font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
