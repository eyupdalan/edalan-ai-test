// Bankacılık ekranları için react-joyride senaryoları.
//
// Yeni senaryo eklemek için:
//   1. Hedef elemente `data-tour="..."` verin (Field/Card/Checkbox/ResultPanel için `tour` prop'u).
//   2. Aşağıya bir Scenario ekleyin. `actions`, adım gösterilmeden ÖNCE çalışır
//      (alan doldurma, tıklama) — böylece kullanıcı sonucu tooltip ile birlikte görür.

import type { Placement } from "react-joyride";

import type { ScenarioAction } from "./actions";

export type ScenarioStep = {
  /** data-tour değeri */
  target: string;
  title: string;
  content: string;
  placement?: Placement | "auto" | "center";
  /** Adım gösterilmeden önce ekranda yapılacak işlemler */
  actions?: ScenarioAction[];
};

export type ScenarioOutcome = "success" | "rejected" | "info";

export type Scenario = {
  id: string;
  title: string;
  description: string;
  /** Senaryonun çalıştığı ekran kodu; null ise mevcut bankacılık sayfasında başlar. */
  screen: string | null;
  outcome: ScenarioOutcome;
  steps: ScenarioStep[];
};

export const scenarios: Scenario[] = [
  // --- KRTTBASV ---------------------------------------------------------------
  {
    id: "krt-gold-onay",
    title: "Gold kart başvurusu onaylanır",
    description: "Gelir yeterli, talep edilen limit tam onaylanır.",
    screen: "KRTTBASV",
    outcome: "success",
    steps: [
      {
        target: "krt-products",
        title: "Kart seçimi",
        content: "Müşteri Gold kartı seçiyor. Gold kart için alt gelir sınırı 20.000 ₺, üst limit 75.000 ₺.",
        actions: [{ type: "click", target: "krt-product-gold" }],
      },
      {
        target: "krt-income",
        title: "Gelir beyanı",
        content: "Aylık net gelir 45.000 ₺ olarak giriliyor. Onaylanabilecek limit gelirin en fazla 3 katıdır.",
        actions: [{ type: "fill", target: "krt-income", value: "45000" }],
      },
      {
        target: "krt-limit",
        title: "Limit talebi",
        content: "Müşteri 30.000 ₺ limit talep ediyor. Gelir ve kart limiti bu talebi karşılıyor.",
        placement: "left",
        actions: [{ type: "fill", target: "krt-limit", value: "30000" }],
      },
      {
        target: "krt-statement-day",
        title: "Hesap kesim günü",
        content: "Hesap kesim günü ayın 15'i olarak seçiliyor.",
        placement: "left",
        actions: [{ type: "fill", target: "krt-statement-day", value: "15" }],
      },
      {
        target: "krt-consents",
        title: "Onaylar",
        content: "KVKK ve ön bilgilendirme onayları zorunlu; ikisi de işaretleniyor.",
        placement: "left",
        actions: [
          { type: "check", target: "krt-kvkk" },
          { type: "check", target: "krt-preinfo" },
        ],
      },
      {
        target: "krt-result",
        title: "Sonuç: Onay",
        content: "Başvuru gönderildi ve 30.000 ₺ limitle onaylandı. Başvuru numarası Kibana loglarındaki transaction.id ile aynı formatta.",
        actions: [{ type: "click", target: "krt-submit" }],
      },
    ],
  },
  {
    id: "krt-gelir-yetersiz",
    title: "Platinum kart: gelir yetersiz",
    description: "Gelir, Platinum kart alt sınırının altında olduğu için başvuru reddedilir.",
    screen: "KRTTBASV",
    outcome: "rejected",
    steps: [
      {
        target: "krt-products",
        title: "Platinum kart",
        content: "Müşteri Platinum kartı seçiyor. Bu kart için en az 60.000 ₺ aylık net gelir gerekiyor.",
        actions: [{ type: "click", target: "krt-product-platinum" }],
      },
      {
        target: "krt-income",
        title: "Düşük gelir beyanı",
        content: "Beyan edilen gelir 30.000 ₺ — alt sınırın altında.",
        actions: [{ type: "fill", target: "krt-income", value: "30000" }],
      },
      {
        target: "krt-limit",
        title: "Yüksek limit talebi",
        content: "Müşteri 100.000 ₺ limit talep ediyor.",
        placement: "left",
        actions: [
          { type: "fill", target: "krt-limit", value: "100000" },
          { type: "check", target: "krt-kvkk" },
          { type: "check", target: "krt-preinfo" },
        ],
      },
      {
        target: "krt-result",
        title: "Sonuç: Ret",
        content: "Başvuru INSUFFICIENT_INCOME gerekçesiyle reddedildi. Müşteriye Gold veya Klasik kart önerilebilir.",
        actions: [{ type: "click", target: "krt-submit" }],
      },
    ],
  },

  // --- KRDTKULL ---------------------------------------------------------------
  {
    id: "krd-36-ay",
    title: "36 ay vadeli ihtiyaç kredisi",
    description: "120.000 ₺ kredi hesaplanır, ödeme planı incelenir ve kullandırılır.",
    screen: "KRDTKULL",
    outcome: "success",
    steps: [
      {
        target: "krd-amount",
        title: "Kredi tutarı",
        content: "Kredi tutarı 120.000 ₺ olarak giriliyor.",
        placement: "right",
        actions: [{ type: "fill", target: "krd-amount", value: "120000" }],
      },
      {
        target: "krd-term",
        title: "Vade",
        content: "Vade 36 ay seçiliyor. 12 ayın üzerindeki vadelerde aylık faiz %3,49.",
        placement: "right",
        actions: [{ type: "fill", target: "krd-term", value: "36" }],
      },
      {
        target: "krd-summary",
        title: "Kredi özeti",
        content: "Taksit, toplam geri ödeme ve yıllık maliyet anlık hesaplanıyor. Taksite KKDF (%15) ve BSMV (%15) dahil.",
      },
      {
        target: "krd-plan",
        title: "Ödeme planı",
        content: "Her taksitte anapara, faiz ve vergi ayrı ayrı görülüyor. Son satırda kalan anapara sıfırlanır.",
        placement: "left",
      },
      {
        target: "krd-contract",
        title: "Sözleşme onayı",
        content: "Genel kredi sözleşmesi onaylanıyor.",
        placement: "right",
        actions: [{ type: "check", target: "krd-contract" }],
      },
      {
        target: "krd-result",
        title: "Kredi kullandırıldı",
        content: "Tahsis ücreti düşüldükten sonra tutar alacak hesabına geçti. İlk taksit bir ay sonra.",
        actions: [{ type: "click", target: "krd-submit" }],
      },
    ],
  },
  {
    id: "krd-gelir-orani",
    title: "Taksit/gelir oranı aşımı",
    description: "Kısa vadede yüksek tutar, taksiti gelirin %50'sinin üzerine çıkarır.",
    screen: "KRDTKULL",
    outcome: "rejected",
    steps: [
      {
        target: "krd-amount",
        title: "Yüksek tutar",
        content: "Kredi tutarı 400.000 ₺ olarak giriliyor.",
        placement: "right",
        actions: [{ type: "fill", target: "krd-amount", value: "400000" }],
      },
      {
        target: "krd-term",
        title: "Kısa vade",
        content: "Vade 3 ay seçiliyor.",
        placement: "right",
        actions: [{ type: "fill", target: "krd-term", value: "3" }],
      },
      {
        target: "krd-summary",
        title: "Yüksek taksit",
        content: "Aylık taksit, müşterinin aylık gelirinin yarısını aşıyor.",
      },
      {
        target: "krd-warning",
        title: "Uygunluk kontrolü",
        content: "Sistem kullandırımı engelledi (AFFORDABILITY_EXCEEDED). Vade uzatılarak veya tutar düşürülerek tekrar denenebilir.",
        placement: "right",
      },
    ],
  },

  // --- ODMTFATR ---------------------------------------------------------------
  {
    id: "odm-dogalgaz",
    title: "Doğalgaz faturası ödeme",
    description: "Abone numarasıyla borç sorgulanır ve ödenir.",
    screen: "ODMTFATR",
    outcome: "success",
    steps: [
      {
        target: "odm-category",
        title: "Fatura türü",
        content: "Fatura türü olarak Doğalgaz seçiliyor.",
        actions: [{ type: "fill", target: "odm-category", value: "Doğalgaz" }],
      },
      {
        target: "odm-institution",
        title: "Kurum",
        content: "Kurum olarak Başkentgaz seçiliyor.",
        actions: [{ type: "fill", target: "odm-institution", value: "Başkentgaz" }],
      },
      {
        target: "odm-subscriber",
        title: "Abone numarası",
        content: "Tesisat numarası giriliyor. Aynı numara her zaman aynı borçları döner.",
        actions: [{ type: "fill", target: "odm-subscriber", value: "4012345678" }],
      },
      {
        target: "odm-bills",
        title: "Borç listesi",
        content: "Sorgulama sonucu ödenmemiş faturalar listelendi. Gecikmiş olanlar işaretli; ödenecekler seçilebilir.",
        actions: [{ type: "click", target: "odm-query" }],
      },
      {
        target: "odm-account",
        title: "Ödeme hesabı",
        content: "Ödeme Ana Hesap'tan yapılacak. Bakiye yetersizse işlem reddedilir.",
        placement: "top",
      },
      {
        target: "odm-result",
        title: "Dekont",
        content: "Ödeme tamamlandı ve dekont numarası üretildi.",
        actions: [{ type: "click", target: "odm-pay" }],
      },
    ],
  },

  // --- MUSTGUNC ---------------------------------------------------------------
  {
    id: "mus-adres",
    title: "Adres değişikliği",
    description: "Müşteri yeni adresini ve iletişim iznini günceller.",
    screen: "MUSTGUNC",
    outcome: "success",
    steps: [
      {
        target: "mus-identity",
        title: "Kimlik bilgileri",
        content: "Ad soyad ve müşteri no bu ekrandan değiştirilemez; şube işlemi gerektirir.",
      },
      {
        target: "mus-city",
        title: "İl",
        content: "Yeni il İstanbul olarak seçiliyor.",
        actions: [{ type: "fill", target: "mus-city", value: "İstanbul" }],
      },
      {
        target: "mus-district",
        title: "İlçe",
        content: "İlçe Beşiktaş olarak giriliyor.",
        actions: [{ type: "fill", target: "mus-district", value: "Beşiktaş" }],
      },
      {
        target: "mus-address",
        title: "Açık adres",
        content: "Yeni açık adres yazılıyor.",
        actions: [{ type: "fill", target: "mus-address", value: "Sinanpaşa Mah. Ihlamurdere Cad. No: 12" }],
      },
      {
        target: "mus-permissions",
        title: "İletişim izinleri",
        content: "E-posta ile bilgilendirme izni açılıyor.",
        placement: "left",
        actions: [{ type: "check", target: "mus-perm-email" }],
      },
      {
        target: "mus-result",
        title: "Güncelleme sonucu",
        content: "Bilgiler kaydedildi ve değişen alanlar listelendi. Not: Senaryoyu tekrar çalıştırırsanız 'Değişiklik yapılmadı' uyarısı görürsünüz.",
        placement: "left",
        actions: [{ type: "click", target: "mus-submit" }],
      },
    ],
  },

  // --- HSPTVDSZ ---------------------------------------------------------------
  {
    id: "hsp-usd",
    title: "USD vadesiz hesap açılışı",
    description: "Döviz hesabı açılır; döviz işlem koşulları onayı istenir.",
    screen: "HSPTVDSZ",
    outcome: "success",
    steps: [
      {
        target: "hsp-currency",
        title: "Döviz cinsi",
        content: "Hesap döviz cinsi olarak USD seçiliyor.",
        actions: [{ type: "click", target: "hsp-currency-USD" }],
      },
      {
        target: "hsp-branch",
        title: "Şube",
        content: "Hesap Levent Şubesi'ne bağlanıyor.",
        actions: [{ type: "fill", target: "hsp-branch", value: "0102" }],
      },
      {
        target: "hsp-name",
        title: "Hesap adı",
        content: "Hesaba müşterinin tanıyacağı bir ad veriliyor.",
        actions: [{ type: "fill", target: "hsp-name", value: "Dolar Birikim" }],
      },
      {
        target: "hsp-fx",
        title: "Döviz onayı",
        content: "TL dışı hesaplarda ek olarak döviz işlem koşullarının kabulü gerekiyor.",
        placement: "left",
        actions: [
          { type: "check", target: "hsp-contract" },
          { type: "check", target: "hsp-preinfo" },
          { type: "check", target: "hsp-fx" },
        ],
      },
      {
        target: "hsp-result",
        title: "Hesap açıldı",
        content: "Hesap numarası ve kontrol basamağı geçerli bir IBAN üretildi.",
        actions: [{ type: "click", target: "hsp-submit" }],
      },
    ],
  },

  // --- Genel ------------------------------------------------------------------
  {
    id: "ekran-kodu",
    title: "Ekran koduyla işlem açma",
    description: "Ekran kodu çubuğundan ODMTFATR yazılarak fatura ödeme ekranına geçilir.",
    screen: null,
    outcome: "info",
    steps: [
      {
        target: "code-bar-input",
        title: "Ekran kodu",
        content: "Her işlem ekranının 8 karakterlik bir kodu var: modül (3) + tip T/R (1) + işlem (4). ODMTFATR yazılıyor.",
        actions: [{ type: "fill", target: "code-bar-input", value: "ODMTFATR" }],
      },
      {
        target: "odm-category",
        title: "Fatura Ödeme ekranı",
        content: "Enter'a basınca ilgili ekran açıldı. Menüde gezinmeden doğrudan işleme geçilebilir.",
        actions: [{ type: "click", target: "code-bar-submit" }],
      },
    ],
  },
];

export function findScenario(id: string) {
  return scenarios.find((s) => s.id === id);
}
