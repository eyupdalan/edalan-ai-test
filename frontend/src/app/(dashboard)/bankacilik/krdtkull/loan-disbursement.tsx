"use client";

import { useMemo, useState } from "react";

import { Button, Checkbox, Field, inputClass, ResultPanel } from "@/components/form";
import { Card } from "@/components/ui";
import { useUser } from "@/lib/auth/user-context";
import { loanPlan, referenceNo } from "@/lib/banking/utils";
import { type Account, formatTRY } from "@/lib/mock-data";

const MIN_AMOUNT = 5_000;
const MAX_AMOUNT = 500_000;
const terms = [3, 6, 12, 18, 24, 36];
const purposes = ["İhtiyaç", "Eğitim", "Sağlık", "Tatil", "Beyaz eşya / Elektronik", "Diğer"];
/** Tahsis ücreti: kredi tutarının binde 5'i */
const ALLOCATION_FEE_RATE = 0.005;

/** Vadeye göre aylık akdi faiz oranı */
function monthlyRateFor(term: number) {
  if (term <= 6) return 0.0309;
  if (term <= 12) return 0.0329;
  return 0.0349;
}

const percent = (v: number, digits = 2) =>
  `%${(v * 100).toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

type Disbursement = {
  ref: string;
  account: Account;
  amount: number;
  fee: number;
  term: number;
  installment: number;
  firstDue: string;
};

export function LoanDisbursement({ accounts }: { accounts: Account[] }) {
  const user = useUser();
  const [amount, setAmount] = useState(50_000);
  const [term, setTerm] = useState(12);
  const [accountId, setAccountId] = useState(accounts[0]?.id);
  const [result, setResult] = useState<Disbursement | null>(null);

  const validAmount = amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;
  const rate = monthlyRateFor(term);
  const plan = useMemo(
    () => loanPlan(validAmount ? amount : 0, rate, term),
    [amount, rate, term, validAmount],
  );
  const fee = amount * ALLOCATION_FEE_RATE;
  // Basit uygunluk kontrolü: taksit, aylık gelirin yarısını geçemez.
  const maxInstallment = user.monthlyIncome * 0.5;
  const affordable = plan.installment <= maxInstallment;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const account = accounts.find((a) => a.id === accountId);
    if (!account || !validAmount || !affordable) return;
    const firstDue = new Date();
    firstDue.setMonth(firstDue.getMonth() + 1);
    setResult({
      ref: referenceNo("KRD"),
      account,
      amount,
      fee,
      term,
      installment: plan.installment,
      firstDue: firstDue.toLocaleDateString("tr-TR"),
    });
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <ResultPanel
          tour="krd-result"
          title="Kredi kullandırıldı"
          rows={[
            { label: "İşlem referansı", value: result.ref },
            { label: "Müşteri", value: `${user.name} (${user.customerNo})` },
            { label: "Kredi tutarı", value: formatTRY(result.amount) },
            { label: "Tahsis ücreti", value: formatTRY(result.fee) },
            { label: "Hesaba geçen tutar", value: formatTRY(result.amount - result.fee) },
            { label: "Alacak hesabı", value: `${result.account.name} · ${result.account.iban}` },
            {
              label: "Vade / Taksit",
              value: `${result.term} ay × ${formatTRY(result.installment)}`,
            },
            { label: "İlk taksit tarihi", value: result.firstDue },
          ]}
        />
        <div>
          <Button variant="secondary" onClick={() => setResult(null)}>
            Yeni kredi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4">
        <Card title="Kredi bilgileri">
          <div className="flex flex-col gap-3">
            <Field
              tour="krd-amount"
              label="Kredi tutarı (₺)"
              hint={`${formatTRY(MIN_AMOUNT)} – ${formatTRY(MAX_AMOUNT)} arası`}
            >
              <input
                type="number"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className={inputClass}
              />
            </Field>
            <Field label="Vade" tour="krd-term">
              <select
                value={term}
                onChange={(e) => setTerm(Number(e.target.value))}
                className={inputClass}
              >
                {terms.map((t) => (
                  <option key={t} value={t}>
                    {t} ay
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kredi amacı">
              <select name="purpose" className={inputClass}>
                {purposes.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Alacak hesabı" tour="krd-account">
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className={inputClass}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {formatTRY(a.balance)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-3">
            {!affordable && validAmount && (
              <p
                data-tour="krd-warning"
                className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-400"
              >
                Taksit tutarı aylık gelirinizin %50&apos;sini ({formatTRY(maxInstallment)}) aşıyor.
                Tutarı düşürün veya vadeyi uzatın.
              </p>
            )}
            <Checkbox
              tour="krd-contract"
              name="contract"
              required
              label="Genel kredi sözleşmesini ve ödeme planını onaylıyorum."
            />
            <Button type="submit" disabled={!validAmount || !affordable} data-tour="krd-submit">
              Krediyi kullandır
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-2">
        <div className="grid gap-3 sm:grid-cols-4" data-tour="krd-summary">
          {[
            { label: "Aylık taksit", value: formatTRY(plan.installment) },
            { label: "Toplam geri ödeme", value: formatTRY(plan.totalPayment) },
            { label: "Aylık faiz", value: percent(rate) },
            { label: "Yıllık maliyet", value: percent(plan.annualCostRate, 1) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-muted">{s.label}</p>
              <p className="mt-1 font-semibold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        <Card
          tour="krd-plan"
          title="Ödeme planı"
          action={
            <span className="text-xs text-muted">
              Faiz {formatTRY(plan.totalInterest)} · Vergi {formatTRY(plan.totalTax)} · Tahsis{" "}
              {formatTRY(fee)}
            </span>
          }
        >
          <div className="-mx-5 -my-5 max-h-[420px] overflow-auto">
            <table className="w-full min-w-[620px] text-sm tabular-nums">
              <thead className="sticky top-0 bg-surface text-right text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Taksit</th>
                  <th className="px-4 py-2.5 font-medium">Anapara</th>
                  <th className="px-4 py-2.5 font-medium">Faiz</th>
                  <th className="px-4 py-2.5 font-medium">KKDF</th>
                  <th className="px-4 py-2.5 font-medium">BSMV</th>
                  <th className="px-4 py-2.5 font-medium">Kalan anapara</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-right">
                {plan.rows.map((r) => (
                  <tr key={r.no}>
                    <td className="px-4 py-2 text-left text-muted">{r.no}</td>
                    <td className="px-4 py-2 font-medium">{formatTRY(r.installment)}</td>
                    <td className="px-4 py-2">{formatTRY(r.principal)}</td>
                    <td className="px-4 py-2">{formatTRY(r.interest)}</td>
                    <td className="px-4 py-2">{formatTRY(r.kkdf)}</td>
                    <td className="px-4 py-2">{formatTRY(r.bsmv)}</td>
                    <td className="px-4 py-2 text-muted">{formatTRY(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </form>
  );
}
