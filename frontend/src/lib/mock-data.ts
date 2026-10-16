// Backend entegrasyonu gelene kadar kullanılan örnek veriler.

import type { BadgeTone } from "@/components/ui";

export const formatTRY = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );

// --- Bankacılık ---

export type Account = {
  id: string;
  name: string;
  iban: string;
  type: "Vadesiz" | "Vadeli" | "Kredi Kartı";
  balance: number;
};

export const accounts: Account[] = [
  { id: "acc-1", name: "Ana Hesap", iban: "TR12 0006 4000 0011 2345 6789 01", type: "Vadesiz", balance: 48250.75 },
  { id: "acc-2", name: "Birikim", iban: "TR45 0006 4000 0022 3456 7890 12", type: "Vadeli", balance: 152000 },
  { id: "acc-3", name: "Kredi Kartı", iban: "**** **** **** 4821", type: "Kredi Kartı", balance: -6340.2 },
];

export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  status: "Tamamlandı" | "Beklemede" | "Reddedildi";
};

export const transactions: Transaction[] = [
  { id: "t1", date: "2026-10-15T09:12:00", description: "Maaş ödemesi", category: "Gelir", amount: 42000, status: "Tamamlandı" },
  { id: "t2", date: "2026-10-14T18:40:00", description: "Market alışverişi", category: "Gıda", amount: -1245.9, status: "Tamamlandı" },
  { id: "t3", date: "2026-10-14T11:05:00", description: "EFT - Ahmet Y.", category: "Transfer", amount: -5000, status: "Beklemede" },
  { id: "t4", date: "2026-10-13T20:22:00", description: "Elektrik faturası", category: "Fatura", amount: -864.3, status: "Tamamlandı" },
  { id: "t5", date: "2026-10-12T15:47:00", description: "Online alışveriş", category: "Alışveriş", amount: -2399, status: "Reddedildi" },
  { id: "t6", date: "2026-10-11T08:30:00", description: "Vadeli faiz getirisi", category: "Gelir", amount: 1820.45, status: "Tamamlandı" },
];

export const transactionStatusTone: Record<Transaction["status"], BadgeTone> = {
  Tamamlandı: "green",
  Beklemede: "amber",
  Reddedildi: "red",
};

// --- Mercek ---

export type Conversation = { id: string; title: string; updatedAt: string };

export const conversations: Conversation[] = [
  { id: "c1", title: "Kredi başvuru metni özeti", updatedAt: "2026-10-15T10:02:00" },
  { id: "c2", title: "Müşteri şikayeti sınıflandırma", updatedAt: "2026-10-14T16:20:00" },
  { id: "c3", title: "SQL sorgusu optimizasyonu", updatedAt: "2026-10-13T09:45:00" },
];

export const mercekStats = { conversationsToday: 24, tokensToday: 182_400, avgLatencyMs: 1350 };

// --- Talep Yönlendirme ---

export type Priority = "Düşük" | "Orta" | "Yüksek" | "Kritik";

export type ServiceRequest = {
  id: string;
  title: string;
  requester: string;
  team: string;
  priority: Priority;
  estimatedHours: number;
  estimatedCost: number;
  status: "Yeni" | "Yönlendirildi" | "Devam Ediyor" | "Tamamlandı";
};

export const priorityTone: Record<Priority, BadgeTone> = {
  Düşük: "gray",
  Orta: "blue",
  Yüksek: "amber",
  Kritik: "red",
};

export const requestStatusTone: Record<ServiceRequest["status"], BadgeTone> = {
  Yeni: "gray",
  Yönlendirildi: "blue",
  "Devam Ediyor": "amber",
  Tamamlandı: "green",
};

export const teams = [
  { name: "Altyapı", hourlyRate: 1450 },
  { name: "Yazılım Geliştirme", hourlyRate: 1650 },
  { name: "Veri & Analitik", hourlyRate: 1800 },
  { name: "Güvenlik", hourlyRate: 2100 },
  { name: "Destek", hourlyRate: 950 },
];

export const priorityMultiplier: Record<Priority, number> = {
  Düşük: 1,
  Orta: 1.15,
  Yüksek: 1.35,
  Kritik: 1.75,
};

export const serviceRequests: ServiceRequest[] = [
  { id: "TLP-1042", title: "VPN erişim sorunu", requester: "Finans", team: "Altyapı", priority: "Yüksek", estimatedHours: 4, estimatedCost: 7830, status: "Devam Ediyor" },
  { id: "TLP-1041", title: "Raporlama ekranına yeni filtre", requester: "Pazarlama", team: "Yazılım Geliştirme", priority: "Orta", estimatedHours: 16, estimatedCost: 30360, status: "Yönlendirildi" },
  { id: "TLP-1040", title: "Şüpheli giriş denemeleri", requester: "Operasyon", team: "Güvenlik", priority: "Kritik", estimatedHours: 8, estimatedCost: 29400, status: "Devam Ediyor" },
  { id: "TLP-1039", title: "Aylık müşteri segment analizi", requester: "CRM", team: "Veri & Analitik", priority: "Düşük", estimatedHours: 24, estimatedCost: 43200, status: "Yeni" },
  { id: "TLP-1038", title: "Şifre sıfırlama talebi", requester: "İK", team: "Destek", priority: "Düşük", estimatedHours: 0.5, estimatedCost: 475, status: "Tamamlandı" },
];
