import {
  Landmark,
  LayoutDashboard,
  type LucideIcon,
  Route,
  Sparkles,
} from "lucide-react";

import { bankingScreens } from "./banking/screens";

export type ModuleKey = "bankacilik" | "mercek" | "talep";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind sınıfları: ikon kutusu ve vurgu rengi */
  accent: string;
  /** Modül aktifken yan menüde gösterilen alt ekranlar */
  children?: { href: string; label: string; code: string }[];
};

export const overviewNav: NavItem = {
  href: "/",
  label: "Genel Bakış",
  description: "Tüm modüllerin özeti",
  icon: LayoutDashboard,
  accent: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

export const modules: Record<ModuleKey, NavItem> = {
  bankacilik: {
    href: "/bankacilik",
    label: "Bankacılık",
    description: "Hesap, transfer ve işlem simülasyonu",
    icon: Landmark,
    accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    children: bankingScreens.map(({ href, title, code }) => ({ href, label: title, code })),
  },
  mercek: {
    href: "/mercek",
    label: "Mercek",
    description: "Azure AI destekli sohbet asistanı",
    icon: Sparkles,
    accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  talep: {
    href: "/talep-yonlendirme",
    label: "Talep Yönlendirme",
    description: "Talep sınıflandırma ve maliyet tahmini",
    icon: Route,
    accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
};

export const navItems: NavItem[] = [overviewNav, ...Object.values(modules)];
