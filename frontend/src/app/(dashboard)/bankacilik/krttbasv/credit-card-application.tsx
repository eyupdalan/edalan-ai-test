"use client";

import { useState } from "react";

import { Button, Checkbox, Field, inputClass, ResultPanel } from "@/components/form";
import { Card } from "@/components/ui";
import { useUser } from "@/lib/auth/user-context";
import { referenceNo } from "@/lib/banking/utils";
import { formatTRY } from "@/lib/mock-data";

const cardProducts = [
  { id: "klasik", name: "Klasik", maxLimit: 25_000, minIncome: 0, fee: 0, color: "from-slate-500 to-slate-700" },
  { id: "gold", name: "Gold", maxLimit: 75_000, minIncome: 20_000, fee: 650, color: "from-amber-400 to-amber-600" },
  { id: "platinum", name: "Platinum", maxLimit: 250_000, minIncome: 60_000, fee: 1450, color: "from-zinc-700 to-zinc-900" },
] as const;

type ProductId = (typeof cardProducts)[number]["id"];

/** Gelir çarpanı: onaylanabilecek limit, aylık net gelirin en fazla bu katı olabilir. */
const INCOME_MULTIPLIER = 3;

type Decision =
  | { status: "approved" | "partial"; ref: string; product: string; limit: number; requested: number; statementDay: string }
  | { status: "rejected"; ref: string; reason: string };

export function CreditCardApplication() {
  const user = useUser();
  const [productId, setProductId] = useState<ProductId>("gold");
  const [decision, setDecision] = useState<Decision | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const product = cardProducts.find((p) => p.id === productId)!;
    const income = Number(data.get("income"));
    const requested = Number(data.get("limit"));
    const ref = referenceNo("KRT");

    if (income < product.minIncome) {
      return setDecision({
        status: "rejected",
        ref,
        reason: `${product.name} kart için en az ${formatTRY(product.minIncome)} aylık net gelir gerekiyor.`,
      });
    }

    const limit = Math.floor(Math.min(requested, income * INCOME_MULTIPLIER, product.maxLimit) / 500) * 500;
    setDecision({
      status: limit < requested ? "partial" : "approved",
      ref,
      product: product.name,
      limit,
      requested,
      statementDay: String(data.get("statementDay")),
    });
  }

  if (decision) {
    return (
      <div className="flex flex-col gap-4">
        {decision.status === "rejected" ? (
          <ResultPanel
            tour="krt-result"
            tone="error"
            title="Başvuru olumsuz sonuçlandı"
            rows={[
              { label: "Başvuru no", value: decision.ref },
              { label: "Gerekçe", value: decision.reason },
            ]}
          />
        ) : (
          <ResultPanel
            tour="krt-result"
            title={decision.status === "approved" ? "Başvuru onaylandı" : "Başvuru kısmi limitle onaylandı"}
            rows={[
              { label: "Başvuru no", value: decision.ref },
              { label: "Müşteri", value: `${user.name} (${user.customerNo})` },
              { label: "Kart", value: decision.product },
              { label: "Talep edilen limit", value: formatTRY(decision.requested) },
              { label: "Onaylanan limit", value: formatTRY(decision.limit) },
              { label: "Hesap kesim günü", value: `Her ayın ${decision.statementDay}. günü` },
            ]}
          >
            <p className="text-sm text-muted">Kartınız 5 iş günü içinde kayıtlı adresinize gönderilecektir.</p>
          </ResultPanel>
        )}
        <div>
          <Button variant="secondary" onClick={() => setDecision(null)}>
            Yeni başvuru
          </Button>
        </div>
      </div>
    );
  }

  const selected = cardProducts.find((p) => p.id === productId)!;

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card title="Kart seçimi" tour="krt-products">
          <div className="grid gap-3 sm:grid-cols-3">
            {cardProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                data-tour={`krt-product-${p.id}`}
                onClick={() => setProductId(p.id)}
                className={`rounded-xl border-2 p-2 text-left transition-colors ${
                  productId === p.id ? "border-emerald-500" : "border-transparent hover:border-border"
                }`}
              >
                <div className={`flex aspect-[1.6] flex-col justify-between rounded-lg bg-gradient-to-br p-3 text-white ${p.color}`}>
                  <span className="text-xs opacity-80">Dalan Bank</span>
                  <span className="font-semibold">{p.name}</span>
                </div>
                <p className="mt-2 text-xs text-muted">Limit: {formatTRY(p.maxLimit)}&apos;ye kadar</p>
                <p className="text-xs text-muted">Yıllık ücret: {p.fee ? formatTRY(p.fee) : "Ücretsiz"}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Gelir ve çalışma bilgileri">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Çalışma durumu">
              <select name="employment" className={inputClass} defaultValue="Özel sektör">
                <option>Özel sektör</option>
                <option>Kamu</option>
                <option>Serbest meslek</option>
                <option>Emekli</option>
                <option>Öğrenci</option>
              </select>
            </Field>
            <Field label="Meslek">
              <input name="occupation" defaultValue={user.occupation} required className={inputClass} />
            </Field>
            <Field label="İşyeri">
              <input name="employer" defaultValue={user.employer} className={inputClass} />
            </Field>
            <Field label="Aylık net gelir (₺)" tour="krt-income">
              <input name="income" type="number" min={0} step={100} defaultValue={user.monthlyIncome} required className={inputClass} />
            </Field>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card title="Kart tercihleri">
          <div className="flex flex-col gap-3">
            <Field label="Talep edilen limit (₺)" tour="krt-limit" hint={`${selected.name} için en fazla ${formatTRY(selected.maxLimit)}`}>
              <input name="limit" type="number" min={1000} max={selected.maxLimit} step={500} defaultValue={20_000} required className={inputClass} />
            </Field>
            <Field label="Hesap kesim günü" tour="krt-statement-day">
              <select name="statementDay" defaultValue="15" className={inputClass}>
                {["1", "5", "10", "15", "20", "25"].map((d) => (
                  <option key={d} value={d}>
                    Her ayın {d}. günü
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Teslimat adresi">
              <select name="delivery" className={inputClass}>
                <option>Ev · {user.address.district}/{user.address.city}</option>
                <option>İş · {user.employer}</option>
                <option>Şubeden teslim</option>
              </select>
            </Field>
          </div>
        </Card>

        <Card tour="krt-consents">
          <div className="flex flex-col gap-3">
            <Checkbox tour="krt-kvkk" name="kvkk" required label="KVKK aydınlatma metnini okudum." />
            <Checkbox tour="krt-preinfo" name="preInfo" required label="Kredi kartı ön bilgilendirme formunu onaylıyorum." />
            <Button type="submit" className="mt-1" data-tour="krt-submit">
              Başvuruyu gönder
            </Button>
          </div>
        </Card>
      </div>
    </form>
  );
}
