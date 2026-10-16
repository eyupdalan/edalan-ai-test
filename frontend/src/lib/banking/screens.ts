import { CreditCard, HandCoins, type LucideIcon, Receipt, UserPen, Wallet } from "lucide-react";

/**
 * Ekran kodu formatı (8 karakter):
 *   [1-3] modül kodu  · KRT, KRD, ODM, MUS, HSP
 *   [4]   ekran tipi  · T = transaction (işlem), R = report (rapor)
 *   [5-8] işlem kodu  · ilgili işlemin kısaltması
 *
 * Örnek: KRT + T + BASV → KRTTBASV (Kartlar / İşlem / Başvuru)
 */
export const SCREEN_CODE_PATTERN = /^[A-Z]{3}[TR][A-Z0-9]{4}$/;

export const bankingModules = {
  KRT: { name: "Kartlar", icon: CreditCard },
  KRD: { name: "Krediler", icon: HandCoins },
  ODM: { name: "Ödemeler", icon: Receipt },
  MUS: { name: "Müşteri", icon: UserPen },
  HSP: { name: "Hesaplar", icon: Wallet },
} satisfies Record<string, { name: string; icon: LucideIcon }>;

export type BankingModuleCode = keyof typeof bankingModules;
export type ScreenType = "T" | "R";

export const screenTypeLabel: Record<ScreenType, string> = {
  T: "İşlem",
  R: "Rapor",
};

export type BankingScreen = {
  code: string;
  module: BankingModuleCode;
  type: ScreenType;
  title: string;
  description: string;
  href: string;
};

function defineScreen(screen: Omit<BankingScreen, "module" | "type" | "href">): BankingScreen {
  if (!SCREEN_CODE_PATTERN.test(screen.code)) {
    throw new Error(`Geçersiz ekran kodu: ${screen.code}`);
  }
  const moduleCode = screen.code.slice(0, 3);
  if (!(moduleCode in bankingModules)) {
    throw new Error(`Tanımsız modül kodu: ${moduleCode} (${screen.code})`);
  }
  return {
    ...screen,
    module: moduleCode as BankingModuleCode,
    type: screen.code[3] as ScreenType,
    href: `/bankacilik/${screen.code.toLowerCase()}`,
  };
}

export const bankingScreens: BankingScreen[] = [
  defineScreen({
    code: "KRTTBASV",
    title: "Kredi Kartı Başvurusu",
    description: "Yeni kredi kartı başvurusu ve limit değerlendirmesi",
  }),
  defineScreen({
    code: "KRDTKULL",
    title: "Bireysel Kredi Kullandırım",
    description: "İhtiyaç kredisi hesaplama, ödeme planı ve kullandırım",
  }),
  defineScreen({
    code: "ODMTFATR",
    title: "Fatura Ödeme",
    description: "Kurum faturası sorgulama ve ödeme",
  }),
  defineScreen({
    code: "MUSTGUNC",
    title: "Müşteri Bilgi Güncelleme",
    description: "İletişim, adres ve gelir bilgilerinin güncellenmesi",
  }),
  defineScreen({
    code: "HSPTVDSZ",
    title: "Vadesiz Hesap Açılışı",
    description: "TL veya döviz vadesiz hesap açılışı",
  }),
];

const screensByCode = new Map(bankingScreens.map((s) => [s.code, s]));

export function findScreen(code: string): BankingScreen | undefined {
  return screensByCode.get(code.trim().toUpperCase());
}

export function getScreen(code: string): BankingScreen {
  const screen = findScreen(code);
  if (!screen) throw new Error(`Ekran bulunamadı: ${code}`);
  return screen;
}

export function findScreenByPath(pathname: string): BankingScreen | undefined {
  return bankingScreens.find((s) => pathname === s.href);
}
