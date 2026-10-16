"use client";

import { useState } from "react";

import { Button, Checkbox, Field, inputClass, ResultPanel } from "@/components/form";
import { Card } from "@/components/ui";
import { useUser } from "@/lib/auth/user-context";
import { formatIban, generateIban, referenceNo } from "@/lib/banking/utils";

const currencies = [
  { code: "TRY", name: "Türk Lirası", symbol: "₺" },
  { code: "USD", name: "ABD Doları", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "İngiliz Sterlini", symbol: "£" },
  { code: "XAU", name: "Altın (gram)", symbol: "gr" },
];

const branches = [
  { code: "0101", name: "Kadıköy Şubesi" },
  { code: "0102", name: "Levent Şubesi" },
  { code: "0601", name: "Kızılay Şubesi" },
  { code: "3501", name: "Alsancak Şubesi" },
  { code: "9999", name: "Dijital Şube" },
];

const purposes = ["Maaş / Gelir", "Birikim", "Ticari işlemler", "Yatırım", "Fatura ödemeleri", "Diğer"];
const fundSources = ["Maaş", "Serbest meslek kazancı", "Kira geliri", "Emekli maaşı", "Miras / Bağış", "Diğer"];

type Opened = {
  ref: string;
  iban: string;
  accountNo: string;
  currency: (typeof currencies)[number];
  branch: (typeof branches)[number];
  accountName: string;
  openedAt: string;
};

export function DemandAccountOpening() {
  const user = useUser();
  const [currencyCode, setCurrencyCode] = useState("TRY");
  const [opened, setOpened] = useState<Opened | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const currency = currencies.find((c) => c.code === currencyCode)!;
    const branch = branches.find((b) => b.code === data.get("branch"))!;
    const { iban, accountNo } = generateIban();
    setOpened({
      ref: referenceNo("HSP"),
      iban,
      accountNo,
      currency,
      branch,
      accountName: String(data.get("accountName")).trim() || `Vadesiz ${currency.code}`,
      openedAt: new Date().toLocaleString("tr-TR"),
    });
  }

  if (opened) {
    return (
      <div className="flex flex-col gap-4">
        <ResultPanel
          tour="hsp-result"
          title="Hesabınız açıldı"
          rows={[
            { label: "İşlem referansı", value: opened.ref },
            { label: "Hesap sahibi", value: `${user.name} (${user.customerNo})` },
            { label: "Hesap adı", value: opened.accountName },
            { label: "Döviz cinsi", value: `${opened.currency.name} (${opened.currency.code})` },
            { label: "Şube", value: `${opened.branch.code} · ${opened.branch.name}` },
            { label: "Hesap no", value: <span className="font-mono">{opened.accountNo}</span> },
            { label: "IBAN", value: <span className="font-mono">{formatIban(opened.iban)}</span> },
            { label: "Açılış tarihi", value: opened.openedAt },
          ]}
        />
        <div>
          <Button variant="secondary" onClick={() => setOpened(null)}>
            Yeni hesap aç
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card title="Döviz cinsi" tour="hsp-currency">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {currencies.map((c) => (
              <button
                key={c.code}
                type="button"
                data-tour={`hsp-currency-${c.code}`}
                onClick={() => setCurrencyCode(c.code)}
                className={`rounded-lg border-2 px-3 py-2.5 text-left transition-colors ${
                  currencyCode === c.code ? "border-emerald-500 bg-emerald-500/5" : "border-border hover:bg-surface-muted"
                }`}
              >
                <p className="font-semibold">
                  {c.symbol} <span className="text-sm">{c.code}</span>
                </p>
                <p className="text-xs text-muted">{c.name}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Hesap bilgileri">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Şube" tour="hsp-branch">
              <select name="branch" defaultValue="9999" className={inputClass}>
                {branches.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} · {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Hesap adı (isteğe bağlı)" tour="hsp-name">
              <input name="accountName" maxLength={30} placeholder={`Vadesiz ${currencyCode}`} className={inputClass} />
            </Field>
            <Field label="Hesap açılış amacı" tour="hsp-purpose">
              <select name="purpose" className={inputClass}>
                {purposes.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Fon kaynağı">
              <select name="fundSource" className={inputClass}>
                {fundSources.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </Field>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card title="Müşteri" tour="hsp-customer">
          <dl className="flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-xs text-muted">Ad soyad</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Müşteri no</dt>
              <dd className="font-mono">{user.customerNo}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Adres</dt>
              <dd>
                {user.address.line}, {user.address.district}/{user.address.city}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <div className="flex flex-col gap-3">
            <Checkbox tour="hsp-contract" name="contract" required label="Hesap sözleşmesini okudum, onaylıyorum." />
            <Checkbox tour="hsp-preinfo" name="preInfo" required label="Ön bilgilendirme formunu teslim aldım." />
            {currencyCode !== "TRY" && (
              <Checkbox tour="hsp-fx" name="fx" required label="Döviz hesabı işlem koşullarını kabul ediyorum." />
            )}
            <Button type="submit" className="mt-1" data-tour="hsp-submit">
              Hesap aç
            </Button>
          </div>
        </Card>
      </div>
    </form>
  );
}
