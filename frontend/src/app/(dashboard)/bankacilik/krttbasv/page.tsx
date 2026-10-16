import type { Metadata } from "next";

import { ScreenHeader } from "@/components/banking/screen-header";

import { CreditCardApplication } from "./credit-card-application";

export const metadata: Metadata = { title: "KRTTBASV · Kredi Kartı Başvurusu" };

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <ScreenHeader code="KRTTBASV" />
      <CreditCardApplication />
    </div>
  );
}
