import type { Metadata } from "next";

import { ScreenHeader } from "@/components/banking/screen-header";
import { accounts } from "@/lib/mock-data";

import { LoanDisbursement } from "./loan-disbursement";

export const metadata: Metadata = { title: "KRDTKULL · Bireysel Kredi Kullandırım" };

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <ScreenHeader code="KRDTKULL" />
      <LoanDisbursement accounts={accounts.filter((a) => a.type === "Vadesiz")} />
    </div>
  );
}
