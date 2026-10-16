import type { Metadata } from "next";

import { ScreenHeader } from "@/components/banking/screen-header";

import { CustomerInfoForm } from "./customer-info-form";

export const metadata: Metadata = { title: "MUSTGUNC · Müşteri Bilgi Güncelleme" };

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <ScreenHeader code="MUSTGUNC" />
      <CustomerInfoForm />
    </div>
  );
}
