"use server";

import { refresh } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { type CustomerInfoUpdate, updateUser, type User } from "@/lib/auth/users";
import { referenceNo } from "@/lib/banking/utils";

export type UpdateState =
  | { ok: true; ref: string; changed: string[] }
  | { ok: false; error: string }
  | undefined;

const fieldLabels: Record<keyof CustomerInfoUpdate, string> = {
  email: "E-posta",
  phone: "Cep telefonu",
  address: "Adres",
  education: "Eğitim durumu",
  occupation: "Meslek",
  employer: "İşyeri",
  monthlyIncome: "Aylık gelir",
  permissions: "İletişim izinleri",
};

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^0/, "90").replace(/^5/, "905");
  if (!/^905\d{9}$/.test(digits)) return null;
  return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
}

export async function updateCustomerInfo(_prev: UpdateState, formData: FormData): Promise<UpdateState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const text = (name: string) => String(formData.get(name) ?? "").trim();

  const email = text("email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Geçerli bir e-posta girin." };

  const phone = formatPhone(text("phone"));
  if (!phone) return { ok: false, error: "Cep telefonu 05XX XXX XX XX formatında olmalı." };

  const monthlyIncome = Number(text("monthlyIncome"));
  if (!Number.isFinite(monthlyIncome) || monthlyIncome < 0) {
    return { ok: false, error: "Aylık gelir geçerli bir tutar olmalı." };
  }

  const changes: CustomerInfoUpdate = {
    email,
    phone,
    address: { city: text("city"), district: text("district"), line: text("addressLine") },
    education: text("education"),
    occupation: text("occupation"),
    employer: text("employer"),
    monthlyIncome,
    permissions: {
      sms: formData.has("permSms"),
      email: formData.has("permEmail"),
      phone: formData.has("permPhone"),
    },
  };

  const changed = (Object.keys(changes) as (keyof CustomerInfoUpdate)[])
    .filter((key) => JSON.stringify(changes[key]) !== JSON.stringify(user[key as keyof User]))
    .map((key) => fieldLabels[key]);

  if (changed.length === 0) return { ok: false, error: "Değişiklik yapılmadı." };

  updateUser(user.id, changes);
  refresh();
  return { ok: true, ref: referenceNo("MUS"), changed };
}
