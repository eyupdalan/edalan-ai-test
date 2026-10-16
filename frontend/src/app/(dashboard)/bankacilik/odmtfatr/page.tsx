import type { Metadata } from "next";

import { ScreenHeader } from "@/components/banking/screen-header";
import { accounts } from "@/lib/mock-data";

import { BillPayment } from "./bill-payment";

export const metadata: Metadata = { title: "ODMTFATR · Fatura Ödeme" };

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <ScreenHeader code="ODMTFATR" />
      <BillPayment accounts={accounts.filter((a) => a.type !== "Kredi Kartı")} />
    </div>
  );
}
