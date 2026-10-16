import type { Metadata } from "next";

import { ScreenHeader } from "@/components/banking/screen-header";

import { DemandAccountOpening } from "./demand-account-opening";

export const metadata: Metadata = { title: "HSPTVDSZ · Vadesiz Hesap Açılışı" };

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <ScreenHeader code="HSPTVDSZ" />
      <DemandAccountOpening />
    </div>
  );
}
