"use client";

import { useState } from "react";

import { useUser } from "@/lib/auth/user-context";
import { type Priority, formatTRY, priorityMultiplier, teams } from "@/lib/mock-data";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-amber-500";

// Geçici anahtar kelime tabanlı yönlendirme; ileride backend'deki modele taşınacak.
const routingRules: { team: string; keywords: string[] }[] = [
  { team: "Güvenlik", keywords: ["güvenlik", "şüpheli", "yetki", "saldırı", "virüs"] },
  { team: "Altyapı", keywords: ["vpn", "sunucu", "ağ", "network", "disk", "erişim"] },
  { team: "Veri & Analitik", keywords: ["rapor", "analiz", "veri", "dashboard", "segment"] },
  { team: "Yazılım Geliştirme", keywords: ["ekran", "özellik", "hata", "bug", "uygulama", "api"] },
];

function suggestTeam(text: string) {
  const lower = text.toLocaleLowerCase("tr-TR");
  return routingRules.find((r) => r.keywords.some((k) => lower.includes(k)))?.team ?? "Destek";
}

const priorities = Object.keys(priorityMultiplier) as Priority[];

export function CostEstimator() {
  const user = useUser();
  const [text, setText] = useState("");
  const [teamOverride, setTeamOverride] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>("Orta");
  const [hours, setHours] = useState(8);

  const team = teamOverride ?? suggestTeam(text);
  const rate = teams.find((t) => t.name === team)?.hourlyRate ?? 0;
  const cost = rate * hours * priorityMultiplier[priority];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        Talep sahibi: <span className="font-medium text-foreground">{user.name}</span> ·{" "}
        {user.department}
      </p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Talep açıklaması</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Örn. VPN bağlantısı kurulamıyor"
          className={`${inputClass} resize-none`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">
          Yönlendirilecek ekip {teamOverride === null && <span className="text-xs">(otomatik)</span>}
        </span>
        <select
          value={team}
          onChange={(e) => setTeamOverride(e.target.value)}
          className={inputClass}
        >
          {teams.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Öncelik</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className={inputClass}
          >
            {priorities.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Efor (saat)</span>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={hours}
            onChange={(e) => setHours(Math.max(0, Number(e.target.value)))}
            className={inputClass}
          />
        </label>
      </div>

      <div className="mt-1 rounded-lg bg-surface-muted p-4">
        <p className="text-xs text-muted">Tahmini maliyet</p>
        <p className="text-2xl font-semibold tabular-nums tracking-tight">{formatTRY(cost)}</p>
        <p className="mt-1 text-xs text-muted">
          {formatTRY(rate)}/saat × {hours} saat × {priorityMultiplier[priority]} öncelik katsayısı
        </p>
      </div>

      <button
        type="button"
        disabled={!text.trim()}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-40"
      >
        Talebi oluştur
      </button>
    </div>
  );
}
