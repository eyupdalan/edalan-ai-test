"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Button, Field, inputClass, ResultPanel } from "@/components/form";
import { Badge, Card } from "@/components/ui";
import { referenceNo } from "@/lib/banking/utils";
import { type Account, formatTRY } from "@/lib/mock-data";

const institutions: Record<string, string[]> = {
  Elektrik: ["CK Boğaziçi Elektrik", "Enerjisa Başkent", "Gediz Elektrik"],
  Su: ["İSKİ", "ASKİ", "İZSU"],
  Doğalgaz: ["İGDAŞ", "Başkentgaz", "İzmirgaz"],
  İnternet: ["Türk Telekom", "Superonline", "Turknet"],
  GSM: ["Turkcell", "Vodafone", "Türk Telekom Mobil"],
};

type Bill = { id: string; period: string; dueDate: Date; amount: number };

/** Abone numarasından tekrarlanabilir sahte fatura listesi üretir. */
function mockBills(subscriberNo: string): Bill[] {
  let seed = [...subscriberNo].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) % 100_000, 7);
  const next = () => (seed = (seed * 9301 + 49297) % 233_280) / 233_280;
  const count = 1 + Math.floor(next() * 3);
  const today = new Date();

  return Array.from({ length: count }, (_, i) => {
    const periodDate = new Date(today.getFullYear(), today.getMonth() - (count - 1 - i), 1);
    const dueDate = new Date(periodDate.getFullYear(), periodDate.getMonth(), 20);
    return {
      id: `${subscriberNo}-${i}`,
      period: periodDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }),
      dueDate,
      amount: Math.round((150 + next() * 1850) * 100) / 100,
    };
  });
}

type Step =
  | { name: "query" }
  | { name: "select"; bills: Bill[] }
  | { name: "done"; ref: string; total: number; count: number; account: Account };

export function BillPayment({ accounts }: { accounts: Account[] }) {
  const [category, setCategory] = useState("Elektrik");
  const [institution, setInstitution] = useState(institutions.Elektrik[0]);
  const [subscriberNo, setSubscriberNo] = useState("");
  const [step, setStep] = useState<Step>({ name: "query" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [accountId, setAccountId] = useState(accounts[0]?.id);
  const [error, setError] = useState<string | null>(null);

  function query(e: React.FormEvent) {
    e.preventDefault();
    const bills = mockBills(subscriberNo);
    setSelected(new Set(bills.map((b) => b.id)));
    setError(null);
    setStep({ name: "select", bills });
  }

  function pay(bills: Bill[]) {
    const account = accounts.find((a) => a.id === accountId);
    const chosen = bills.filter((b) => selected.has(b.id));
    const total = chosen.reduce((s, b) => s + b.amount, 0);
    if (!account) return;
    if (total > account.balance) return setError("Seçilen hesapta yeterli bakiye yok.");
    setStep({ name: "done", ref: referenceNo("ODM"), total, count: chosen.length, account });
  }

  function reset() {
    setSubscriberNo("");
    setError(null);
    setStep({ name: "query" });
  }

  if (step.name === "done") {
    return (
      <div className="flex flex-col gap-4">
        <ResultPanel
          tour="odm-result"
          title="Ödeme başarılı"
          rows={[
            { label: "Dekont no", value: step.ref },
            { label: "Kurum", value: `${institution} (${category})` },
            { label: "Abone no", value: subscriberNo },
            { label: "Ödenen fatura", value: `${step.count} adet` },
            { label: "Toplam tutar", value: formatTRY(step.total) },
            { label: "Borçlandırılan hesap", value: step.account.name },
          ]}
        />
        <div>
          <Button variant="secondary" onClick={reset}>
            Yeni ödeme
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Fatura sorgulama">
        <form onSubmit={query} className="grid items-end gap-3 sm:grid-cols-4">
          <Field label="Fatura türü" tour="odm-category">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setInstitution(institutions[e.target.value][0]);
                setStep({ name: "query" });
              }}
              className={inputClass}
            >
              {Object.keys(institutions).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Kurum" tour="odm-institution">
            <select
              value={institution}
              onChange={(e) => {
                setInstitution(e.target.value);
                setStep({ name: "query" });
              }}
              className={inputClass}
            >
              {institutions[category].map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </Field>
          <Field label="Abone / Tesisat no" tour="odm-subscriber">
            <input
              value={subscriberNo}
              onChange={(e) => {
                setSubscriberNo(e.target.value.replace(/\D/g, ""));
                setStep({ name: "query" });
              }}
              inputMode="numeric"
              minLength={6}
              maxLength={12}
              required
              placeholder="Örn. 4012345678"
              className={inputClass}
            />
          </Field>
          <Button type="submit" className="flex items-center justify-center gap-2" data-tour="odm-query">
            <Search className="size-4" /> Sorgula
          </Button>
        </form>
      </Card>

      {step.name === "select" && (
        <Card title={`Borçlar · ${institution}`} tour="odm-bills">
          <ul className="-mx-5 -mt-5 divide-y divide-border">
            {step.bills.map((b) => {
              const overdue = b.dueDate < new Date();
              return (
                <li key={b.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-5 py-3 text-sm hover:bg-surface-muted">
                    <input
                      type="checkbox"
                      checked={selected.has(b.id)}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(b.id);
                        else next.delete(b.id);
                        setSelected(next);
                      }}
                      className="size-4 accent-emerald-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium capitalize">{b.period}</p>
                      <p className="text-xs text-muted">Son ödeme: {b.dueDate.toLocaleDateString("tr-TR")}</p>
                    </div>
                    {overdue && <Badge tone="red">Gecikmiş</Badge>}
                    <span className="w-28 text-right font-medium tabular-nums">{formatTRY(b.amount)}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
            <Field label="Ödeme yapılacak hesap" className="min-w-60" tour="odm-account">
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {formatTRY(a.balance)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted">Toplam</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatTRY(step.bills.filter((b) => selected.has(b.id)).reduce((s, b) => s + b.amount, 0))}
                </p>
              </div>
              <Button onClick={() => pay(step.bills)} disabled={selected.size === 0} data-tour="odm-pay">
                Öde
              </Button>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        </Card>
      )}
    </div>
  );
}
