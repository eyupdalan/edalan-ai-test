// Bankacılık simülasyonu yardımcıları (backend gelene kadar istemcide hesaplanır).

/** Örn. KRT-20261015-482913 */
export function referenceNo(prefix: string) {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  return `${prefix}-${date}-${rand}`;
}

function randomDigits(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

function mod97(numeric: string) {
  let remainder = 0;
  for (const ch of numeric) remainder = (remainder * 10 + Number(ch)) % 97;
  return remainder;
}

/** Simülasyon banka kodu; gerçek bir bankaya ait değildir. */
const SIM_BANK_CODE = "00999";

/** Kontrol basamakları geçerli (mod 97) bir TR IBAN üretir. */
export function generateIban() {
  const accountNo = randomDigits(16);
  const bban = `${SIM_BANK_CODE}0${accountNo}`;
  // "TR00" sona taşınır; T=29, R=27
  const check = String(98 - mod97(`${bban}292700`)).padStart(2, "0");
  return { iban: `TR${check}${bban}`, accountNo };
}

export function formatIban(iban: string) {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

// --- Kredi hesaplama ---

export const KKDF_RATE = 0.15;
export const BSMV_RATE = 0.15;

export type InstallmentRow = {
  no: number;
  installment: number;
  principal: number;
  interest: number;
  kkdf: number;
  bsmv: number;
  balance: number;
};

/**
 * Eşit taksitli ödeme planı. KKDF ve BSMV faiz üzerinden alınır,
 * bu yüzden taksit vergili efektif oranla hesaplanır.
 */
export function loanPlan(amount: number, monthlyRate: number, term: number) {
  const effective = monthlyRate * (1 + KKDF_RATE + BSMV_RATE);
  const installment =
    effective === 0 ? amount / term : (amount * effective) / (1 - Math.pow(1 + effective, -term));

  const rows: InstallmentRow[] = [];
  let balance = amount;
  for (let no = 1; no <= term; no++) {
    const interest = balance * monthlyRate;
    const kkdf = interest * KKDF_RATE;
    const bsmv = interest * BSMV_RATE;
    const principal = no === term ? balance : installment - interest - kkdf - bsmv;
    balance = Math.max(0, balance - principal);
    rows.push({ no, installment, principal, interest, kkdf, bsmv, balance });
  }

  const totalPayment = installment * term;
  return {
    installment,
    rows,
    totalPayment,
    totalInterest: rows.reduce((s, r) => s + r.interest, 0),
    totalTax: rows.reduce((s, r) => s + r.kkdf + r.bsmv, 0),
    annualCostRate: Math.pow(1 + effective, 12) - 1,
  };
}
