import type { Metadata } from "next";

import { Badge, Card, PageHeader, StatCard } from "@/components/ui";
import { formatTRY, priorityTone, requestStatusTone, serviceRequests } from "@/lib/mock-data";
import { modules } from "@/lib/modules";

import { CostEstimator } from "./cost-estimator";

export const metadata: Metadata = { title: "Talep Yönlendirme" };

export default function RequestRoutingPage() {
  const { label, description, icon, accent } = modules.talep;
  const open = serviceRequests.filter((r) => r.status !== "Tamamlandı");
  const totalCost = open.reduce((s, r) => s + r.estimatedCost, 0);
  const totalHours = open.reduce((s, r) => s + r.estimatedHours, 0);

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader title={label} description={description} icon={icon} accent={accent} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Açık talep" value={String(open.length)} hint={`Toplam ${serviceRequests.length} talep`} />
        <StatCard label="Tahmini efor" value={`${totalHours} saat`} hint="Açık talepler" />
        <StatCard label="Tahmini maliyet" value={formatTRY(totalCost)} hint="Açık talepler" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="Talepler" className="lg:col-span-2">
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="px-5 py-2.5 font-medium">Talep</th>
                  <th className="px-5 py-2.5 font-medium">Ekip</th>
                  <th className="px-5 py-2.5 font-medium">Öncelik</th>
                  <th className="px-5 py-2.5 font-medium">Durum</th>
                  <th className="px-5 py-2.5 text-right font-medium">Maliyet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {serviceRequests.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-muted">
                        {r.id} · {r.requester}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">{r.team}</td>
                    <td className="px-5 py-3">
                      <Badge tone={priorityTone[r.priority]}>{r.priority}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={requestStatusTone[r.status]}>{r.status}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">
                      <p className="font-medium">{formatTRY(r.estimatedCost)}</p>
                      <p className="text-xs text-muted">{r.estimatedHours} saat</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Yeni talep & maliyet tahmini">
          <CostEstimator />
        </Card>
      </div>
    </div>
  );
}
