import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Badge, Card, PageHeader } from "@/components/ui";
import { getFirstName } from "@/lib/auth/format";
import { requireUser } from "@/lib/auth/session";
import {
  accounts,
  formatDate,
  formatTRY,
  mercekStats,
  requestStatusTone,
  serviceRequests,
  transactions,
} from "@/lib/mock-data";
import { modules } from "@/lib/modules";

export default async function OverviewPage() {
  const user = await requireUser();
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const openRequests = serviceRequests.filter((r) => r.status !== "Tamamlandı");
  const openCost = openRequests.reduce((sum, r) => sum + r.estimatedCost, 0);

  const moduleCards = [
    {
      module: modules.bankacilik,
      stats: [
        { label: "Toplam bakiye", value: formatTRY(totalBalance) },
        { label: "Hesap sayısı", value: String(accounts.length) },
      ],
    },
    {
      module: modules.mercek,
      stats: [
        { label: "Bugünkü sohbet", value: String(mercekStats.conversationsToday) },
        { label: "Token kullanımı", value: mercekStats.tokensToday.toLocaleString("tr-TR") },
      ],
    },
    {
      module: modules.talep,
      stats: [
        { label: "Açık talep", value: String(openRequests.length) },
        { label: "Tahmini maliyet", value: formatTRY(openCost) },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={`Hoş geldin, ${getFirstName(user.name)}`}
        description={`${user.title} · ${user.department}`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {moduleCards.map(({ module, stats }) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.href}
              href={module.href}
              className="group rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className={`flex size-10 items-center justify-center rounded-xl ${module.accent}`}>
                  <Icon className="size-5" />
                </span>
                <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
              </div>
              <h2 className="mt-4 font-semibold">{module.label}</h2>
              <p className="text-sm text-muted">{module.description}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt className="text-xs text-muted">{s.label}</dt>
                    <dd className="text-sm font-semibold tabular-nums">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card
          title="Son banka işlemleri"
          action={
            <Link href={modules.bankacilik.href} className="text-xs text-muted hover:text-foreground">
              Tümü
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {transactions.slice(0, 4).map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium">{t.description}</p>
                  <p className="text-xs text-muted">{formatDate(t.date)}</p>
                </div>
                <span
                  className={`tabular-nums font-medium ${t.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                >
                  {formatTRY(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Son talepler"
          action={
            <Link href={modules.talep.href} className="text-xs text-muted hover:text-foreground">
              Tümü
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {serviceRequests.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.title}</p>
                  <p className="text-xs text-muted">
                    {r.id} · {r.team}
                  </p>
                </div>
                <Badge tone={requestStatusTone[r.status]}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
