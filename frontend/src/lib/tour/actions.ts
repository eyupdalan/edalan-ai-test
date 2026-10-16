// Senaryo adımlarında ekranla etkileşim (alan doldurma, tıklama) için DOM yardımcıları.
// React'in kontrollü/kontrolsüz input'larının değişikliği algılaması için native setter + event kullanılır.

export type ScenarioAction =
  /** input / textarea / select doldurur. Metin alanlarında yazma efekti uygulanır. */
  | { type: "fill"; target: string; value: string }
  /** Hedefe (veya içindeki ilk butona) tıklar. */
  | { type: "click"; target: string }
  /** Checkbox'ı istenen duruma getirir. */
  | { type: "check"; target: string; checked?: boolean }
  /** Belirtilen süre kadar bekler. */
  | { type: "wait"; ms: number };

export const tourSelector = (target: string) => `[data-tour="${target}"]`;

const TYPING_DELAY_MS = 35;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Hedef elementi, en fazla `timeout` ms boyunca DOM'da arar. */
async function findElement(target: string, timeout = 3000): Promise<HTMLElement> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = document.querySelector<HTMLElement>(tourSelector(target));
    if (el) return el;
    await sleep(50);
  }
  throw new Error(`Senaryo hedefi bulunamadı: ${target}`);
}

/** data-tour bir label/kapsayıcıdaysa içindeki form kontrolünü döner. */
function resolveControl<T extends HTMLElement>(el: HTMLElement, selector: string): T {
  return (el.matches(selector) ? el : el.querySelector(selector)) as T;
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto = Object.getPrototypeOf(el);
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
}

async function fill(target: string, value: string) {
  const host = await findElement(target);
  const el = resolveControl<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    host,
    "input, textarea, select",
  );
  if (!el) throw new Error(`Doldurulacak alan yok: ${target}`);
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.focus();

  if (el instanceof HTMLSelectElement) {
    setNativeValue(el, value);
    el.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (el.type === "number") {
    setNativeValue(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  } else {
    setNativeValue(el, "");
    for (let i = 1; i <= value.length; i++) {
      setNativeValue(el, value.slice(0, i));
      el.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(TYPING_DELAY_MS);
    }
  }
  el.blur();
}

async function click(target: string) {
  const host = await findElement(target);
  const el = resolveControl<HTMLElement>(host, "button, a, input[type=checkbox]") ?? host;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.click();
}

async function check(target: string, checked = true) {
  const host = await findElement(target);
  const el = resolveControl<HTMLInputElement>(host, "input[type=checkbox]");
  if (el && el.checked !== checked) el.click();
}

export async function runActions(actions: ScenarioAction[]) {
  for (const action of actions) {
    switch (action.type) {
      case "fill":
        await fill(action.target, action.value);
        break;
      case "click":
        await click(action.target);
        break;
      case "check":
        await check(action.target, action.checked);
        break;
      case "wait":
        await sleep(action.ms);
        break;
    }
    await sleep(120);
  }
}
