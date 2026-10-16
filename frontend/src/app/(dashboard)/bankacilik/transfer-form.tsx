"use client";

import { useState } from "react";

import { type Account, formatTRY } from "@/lib/mock-data";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500";

export function TransferForm({ accounts }: { accounts: Account[] }) {
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const amount = Number(data.get("amount"));
    const from = accounts.find((a) => a.id === data.get("from"));
    // Simülasyon: backend entegrasyonuna kadar yalnızca doğrulama yapılır.
    if (!from || amount <= 0) return setMessage("Geçerli bir tutar girin.");
    if (amount > from.balance) return setMessage("Yetersiz bakiye.");
    setMessage(`${formatTRY(amount)} transfer talebi oluşturuldu (simülasyon).`);
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Gönderen hesap</span>
        <select name="from" className={inputClass}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {formatTRY(a.balance)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Alıcı IBAN</span>
        <input name="iban" required placeholder="TR00 0000 ..." className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Tutar (₺)</span>
        <input name="amount" type="number" min="0.01" step="0.01" required className={inputClass} />
      </label>
      <button
        type="submit"
        className="mt-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Gönder
      </button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </form>
  );
}
