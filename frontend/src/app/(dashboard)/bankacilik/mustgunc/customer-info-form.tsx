"use client";

import { startTransition, useActionState } from "react";

import { Button, Checkbox, Field, inputClass, ResultPanel } from "@/components/form";
import { Card } from "@/components/ui";
import { useUser } from "@/lib/auth/user-context";

import { updateCustomerInfo } from "./actions";

const cities = ["Adana", "Ankara", "Antalya", "Bursa", "Eskişehir", "İstanbul", "İzmir", "Kocaeli", "Konya", "Trabzon"];
const educationLevels = ["İlkokul", "Ortaokul", "Lise", "Ön Lisans", "Lisans", "Yüksek Lisans", "Doktora"];

export function CustomerInfoForm() {
  const user = useUser();
  const [state, action, pending] = useActionState(updateCustomerInfo, undefined);

  return (
    <form
      // action prop'u yerine onSubmit: hata durumunda React formu sıfırlamasın.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="grid gap-4 lg:grid-cols-3"
    >
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card title="Kimlik bilgileri" tour="mus-identity">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Ad soyad" hint="Kimlik bilgileri şubeden güncellenir.">
              <input value={user.name} readOnly className={inputClass} />
            </Field>
            <Field label="Müşteri no">
              <input value={user.customerNo} readOnly className={`${inputClass} font-mono`} />
            </Field>
          </div>
        </Card>

        <Card title="İletişim bilgileri">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="E-posta" tour="mus-email">
              <input name="email" type="email" defaultValue={user.email} required className={inputClass} />
            </Field>
            <Field label="Cep telefonu">
              <input name="phone" type="tel" defaultValue={user.phone} required className={inputClass} />
            </Field>
            <Field label="İl" tour="mus-city">
              <select name="city" defaultValue={user.address.city} className={inputClass}>
                {[...new Set([user.address.city, ...cities])].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="İlçe" tour="mus-district">
              <input name="district" defaultValue={user.address.district} required className={inputClass} />
            </Field>
            <Field label="Açık adres" className="sm:col-span-2" tour="mus-address">
              <textarea
                name="addressLine"
                defaultValue={user.address.line}
                rows={2}
                required
                className={`${inputClass} resize-none`}
              />
            </Field>
          </div>
        </Card>

        <Card title="Mesleki ve finansal bilgiler">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eğitim durumu">
              <select name="education" defaultValue={user.education} className={inputClass}>
                {educationLevels.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </Field>
            <Field label="Meslek">
              <input name="occupation" defaultValue={user.occupation} required className={inputClass} />
            </Field>
            <Field label="İşyeri">
              <input name="employer" defaultValue={user.employer} className={inputClass} />
            </Field>
            <Field label="Aylık net gelir (₺)" tour="mus-income">
              <input
                name="monthlyIncome"
                type="number"
                min={0}
                step={100}
                defaultValue={user.monthlyIncome}
                required
                className={inputClass}
              />
            </Field>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card title="İletişim izinleri" tour="mus-permissions">
          <div className="flex flex-col gap-3">
            <Checkbox name="permSms" defaultChecked={user.permissions.sms} label="SMS ile bilgilendirme" />
            <Checkbox tour="mus-perm-email" name="permEmail" defaultChecked={user.permissions.email} label="E-posta ile bilgilendirme" />
            <Checkbox name="permPhone" defaultChecked={user.permissions.phone} label="Telefonla arama" />
          </div>
        </Card>

        <Button type="submit" disabled={pending} data-tour="mus-submit">
          {pending ? "Kaydediliyor…" : "Bilgileri güncelle"}
        </Button>

        {state?.ok === false && <ResultPanel tour="mus-result" tone="error" title={state.error} />}
        {state?.ok && (
          <ResultPanel
            tour="mus-result"
            title="Bilgiler güncellendi"
            rows={[
              { label: "İşlem referansı", value: state.ref },
              { label: "Güncellenen alanlar", value: state.changed.join(", ") },
            ]}
          />
        )}
      </div>
    </form>
  );
}
