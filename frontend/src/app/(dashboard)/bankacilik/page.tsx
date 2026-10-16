import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ScreenCode } from "@/components/banking/screen-header";

import { Badge, Card, PageHeader, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { bankingModules, bankingScreens, screenTypeLabel } from "@/lib/banking/screens";
import {
  accounts,
  formatDate,
  formatTRY,
  transactionStatusTone,
  transactions,
} from "@/lib/mock-data";
import { modules } from "@/lib/modules";

import { TransferForm } from "./transfer-form";

export const metadata: Metadata = { title: "Bankacılık" };

export default async function BankingPage() {
  const user = await requireUser();
  const { label, description, icon, accent } = modules.bankacilik;
  const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={label}
        description={description}
        icon={icon}
        accent={accent}
        actions={
          <div className="text-right text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted">Müşteri no: {user.customerNo}</p>
          </div>
        }
      />

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">İşlem ekranları</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {bankingScreens.map((screen) => {
            const { name, icon: Icon } = bankingModules[screen.module];
            return (
              <Link
                key={screen.code}
                href={screen.href}
                className="group flex flex-col rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Icon className="size-4" />
                  </span>
                  <ScreenCode code={screen.code} />
                </div>
                <p className="mt-3 text-sm font-medium">{screen.title}</p>
                <p className="mt-0.5 flex-1 text-xs text-muted">{screen.description}</p>
                <p className="mt-3 flex items-center justify-between text-xs text-muted">
                  {name} · {screenTypeLabel[screen.type]}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Toplam varlık"
          value={formatTRY(accounts.filter((a) => a.balance > 0).reduce((s, a) => s + a.balance, 0))}
        />
        <StatCard label="Bu ay gelir" value={formatTRY(income)} />
        <StatCard label="Bu ay gider" value={formatTRY(Math.abs(expense))} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {accounts.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="font-medium">{a.name}</p>
              <Badge>{a.type}</Badge>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight">
              {formatTRY(a.balance)}
            </p>
            <p className="mt-1 truncate font-mono text-xs text-muted">{a.iban}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="Hesap hareketleri" className="lg:col-span-2">
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="px-5 py-2.5 font-medium">Tarih</th>
                  <th className="px-5 py-2.5 font-medium">Açıklama</th>
                  <th className="px-5 py-2.5 font-medium">Durum</th>
                  <th className="px-5 py-2.5 text-right font-medium">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-muted">{formatDate(t.date)}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{t.description}</p>
                      <p className="text-xs text-muted">{t.category}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={transactionStatusTone[t.status]}>{t.status}</Badge>
                    </td>
                    <td
                      className={`whitespace-nowrap px-5 py-3 text-right font-medium tabular-nums ${
                        t.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : ""
                      }`}
                    >
                      {formatTRY(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Para transferi">
          <TransferForm accounts={accounts.filter((a) => a.type !== "Kredi Kartı")} />
        </Card>
      </div>
    </div>
  );
}
