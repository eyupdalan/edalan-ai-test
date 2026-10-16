import type { Metadata } from "next";

import { conversations } from "@/lib/mock-data";

import { Chat } from "./chat";

export const metadata: Metadata = { title: "Mercek" };

export default function MercekPage() {
  return <Chat conversations={conversations} />;
}
