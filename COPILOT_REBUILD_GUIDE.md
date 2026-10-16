# Yeniden İnşa Yönergesi (GitHub Copilot için)

Bu belge, `edalan-test2` projesinin baştan sona yeniden oluşturulması için hazırlanmış
adım adım bir yönerge setidir. GitHub Copilot'a (**Agent mode** önerilir) **her seferinde tek bir
faz** verilmelidir. Her fazın sonunda "Kabul kriterleri" ve "Doğrulama" adımları çalıştırılmadan
bir sonraki faza geçilmemelidir.

---

## 0. Copilot'a genel talimatlar (her fazdan önce geçerli)

Aşağıdaki metni oturumun başında Copilot'a verin (veya `.github/copilot-instructions.md`
dosyasına kopyalayın):

```text
- Arayüz metinleri, yorumlar ve kullanıcıya dönük mesajlar Türkçe olacak. Kod tanımlayıcıları İngilizce.
- Frontend: Next.js 16 (App Router, TypeScript, Tailwind CSS v4, src/ dizini, "@/*" alias), npm.
- Backend: Python 3.12, FastAPI, uv ile yönetilir.
- Next.js 16'nın API'leri eğitim verisindekinden farklı olabilir. Kod yazmadan önce
  frontend/node_modules/next/dist/docs/ altındaki ilgili rehberi oku (frontend/AGENTS.md bunu ister).
- next.config.ts içinde `cacheComponents: true` açıktır: cookies()/searchParams okuyan her şey
  bir <Suspense> sınırı içinde olmalıdır, aksi halde build hata verir.
- Middleware'in adı Next.js 16'da "proxy"dir: dosya src/proxy.ts, export edilen fonksiyon `proxy`.
- Ek bağımlılık eklemeden önce gerekçesini söyle. Sürümleri tam (exact) yaz.
- Her değişiklikten sonra: `npm run build`, `npx tsc --noEmit`, `npm run lint` (frontend);
  `uv run pytest`, `uv run ruff check .` (backend). Hata varsa düzeltmeden bitirme.
- Tüm veriler simülasyondur; gerçek banka/kurum entegrasyonu yoktur.
```

### Kullanılan sürümler (referans)

| Paket | Sürüm |
|---|---|
| next / eslint-config-next | 16.4.1 |
| react / react-dom | 19.3.0 |
| tailwindcss | ^4 (`@tailwindcss/turbopack`) |
| lucide-react | güncel |
| server-only | güncel |
| react-joyride | **3.2.0** (React 19 desteği v3 ile geldi; v2 API'si farklıdır) |
| Python | 3.12 (backend), script'ler 3.9 uyumlu |
| fastapi, uvicorn[standard], pydantic-settings | güncel |
| pytest, httpx, ruff (dev) | güncel |

### Nihai dizin yapısı

```
edalan-test2/
├── frontend/                     Next.js uygulaması (port 3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        kök layout (lang="tr", Geist fontları)
│   │   │   ├── globals.css       tema token'ları
│   │   │   ├── (auth)/giris/     giriş sayfası
│   │   │   └── (dashboard)/      oturum gerektiren tüm sayfalar
│   │   │       ├── layout.tsx    Suspense + UserProvider + Sidebar
│   │   │       ├── page.tsx      Genel Bakış
│   │   │       ├── profil/
│   │   │       ├── mercek/
│   │   │       ├── talep-yonlendirme/
│   │   │       └── bankacilik/
│   │   │           ├── layout.tsx            ScenarioProvider + ScreenCodeBar
│   │   │           ├── page.tsx              bankacılık ana sayfası
│   │   │           ├── transfer-form.tsx
│   │   │           ├── krttbasv/  krdtkull/  odmtfatr/  mustgunc/  hsptvdsz/
│   │   ├── components/           ui.tsx, form.tsx, sidebar.tsx, user-menu.tsx,
│   │   │                         banking/, tour/
│   │   ├── lib/                  modules.ts, mock-data.ts, auth/, banking/, tour/
│   │   └── proxy.ts
│   └── .env.example
├── backend/                      FastAPI (port 8000)
│   ├── app/ (main.py, config.py, api/health.py)
│   └── tests/
├── tools/
│   ├── generate_banking_logs.py  Kibana için sentetik log üretici
│   ├── README.md
│   └── KIBANA_AZURE_ROADMAP.md
├── README.md
└── .gitignore
```

---

## Faz 1 — Monorepo iskeleti

### Copilot'a verilecek istem

> Bu klasörde hem frontend hem backend olacak. `frontend/` Next.js, `backend/` Python (FastAPI) uygulaması.
> Aşağıdaki spesifikasyona göre iskeleti kur.

### Spesifikasyon

**Frontend**

```bash
npx create-next-app@latest frontend --ts --eslint --tailwind --app --src-dir \
  --import-alias "@/*" --use-npm --turbopack --no-git --yes
```

- ⚠️ `--no-git` verilse bile `frontend/.git` oluşabiliyor. İçinde yalnızca otomatik ilk commit
  varsa **silinmeli**; depo kökte tek olacak.
- `frontend/.env.example` → `NEXT_PUBLIC_API_URL=http://localhost:8000`; aynısını `.env.local` olarak kopyala.
- ⚠️ `frontend/.gitignore` içindeki `.env*` kuralı `.env.example`'ı da dışlar. Hemen altına
  `!.env.example` ekle.

**Backend**

```bash
uv init backend --app --python 3.12 --vcs none
cd backend
uv add fastapi "uvicorn[standard]" pydantic-settings
uv add --dev pytest httpx ruff
```

- `main.py` (uv'nin ürettiği) silinir. Yapı:
  - `app/__init__.py`, `app/api/__init__.py`, `tests/__init__.py`
  - `app/config.py`: `pydantic_settings.BaseSettings`, `env_file=".env"`, `extra="ignore"`;
    alanlar `app_name: str = "Backend API"`, `cors_origins: list[str] = ["http://localhost:3000"]`.
  - `app/api/health.py`: `APIRouter(tags=["health"])`, `GET /health` → `{"status": "ok"}`.
  - `app/main.py`: `FastAPI(title=settings.app_name)`, `CORSMiddleware` (origins ayarlardan,
    credentials açık, tüm method/header), router `prefix="/api"` ile.
  - `tests/test_health.py`: `TestClient` ile `/api/health` → 200 ve `{"status": "ok"}`.
- `pyproject.toml` ekleri:
  ```toml
  [tool.ruff]
  line-length = 100
  [tool.ruff.lint]
  select = ["E", "F", "I", "UP", "B"]
  [tool.pytest.ini_options]
  pythonpath = ["."]
  ```
- `.env.example`: `APP_NAME="Backend API"` ve `CORS_ORIGINS=["http://localhost:3000"]`; `.env` olarak kopyala.
- `backend/README.md`: `uv sync`, `uv run uvicorn app.main:app --reload --port 8000`, `/docs`, test ve lint komutları.

**Kök**

- `.gitignore`: `.DS_Store`, `.idea/`, `.vscode/`, `backend/.venv/`, `backend/.env`,
  `__pycache__/`, `*.pyc`, `.pytest_cache/`, `.ruff_cache/`.
- `README.md`: klasör/teknoloji/port tablosu ve iki terminalde çalıştırma komutları.
- `git init` (commit atma).

### Kabul kriterleri ve doğrulama

- `cd backend && uv run pytest -q && uv run ruff check . && uv run ruff format --check .` → geçer.
- `cd frontend && npm run lint && npx tsc --noEmit` → hatasız.

---

## Faz 2 — Dashboard ve 3 ana modül

### Copilot'a verilecek istem

> Web projesinde 3 ana modül olacak: (1) bankacılık sistemi simülasyonu, (2) "Mercek": Claude benzeri
> sohbet arayüzü, arkada Azure AI ile çalışacak, (3) talep yönlendirme ve maliyet tahminleme.
> Bunlara uygun bir dashboard oluştur.

### Spesifikasyon

**Bağımlılık:** `npm install lucide-react`. Next.js'in örnek `page.tsx` ve `public/*.svg` dosyaları silinir.

**Tema (`src/app/globals.css`)** — Tailwind v4 `@theme inline` ile token'lar:

| Token | Açık | Koyu |
|---|---|---|
| `--background` | `#f6f7f9` | `#0d0f13` |
| `--foreground` | `#16181d` | `#e8eaee` |
| `--surface` | `#ffffff` | `#15181e` |
| `--surface-muted` | `#f1f2f5` | `#1c2027` |
| `--border` | `#e3e5ea` | `#262b34` |
| `--muted` | `#6b7180` | `#9198a6` |

Koyu tema `prefers-color-scheme: dark` ile. `--color-*` olarak `@theme inline`'a bağlanır
(`bg-surface`, `text-muted`, `border-border` gibi sınıflar kullanılabilir). Fontlar: `--font-geist-sans`/`--font-geist-mono`.

**Kök layout:** `lang="tr"`, Geist fontu `subsets: ["latin", "latin-ext"]`,
metadata `title: { default: "Kontrol Paneli", template: "%s · Kontrol Paneli" }`.

**Rotalar:** `(dashboard)` route group'u altında: `/` (Genel Bakış), `/bankacilik`, `/mercek`, `/talep-yonlendirme`.

**`src/lib/modules.ts`:** `NavItem = { href, label, description, icon: LucideIcon, accent }`.
`overviewNav` (LayoutDashboard, slate) + `modules`:

| key | href | label | ikon | vurgu rengi |
|---|---|---|---|---|
| bankacilik | /bankacilik | Bankacılık | Landmark | emerald |
| mercek | /mercek | Mercek | Sparkles | violet |
| talep | /talep-yonlendirme | Talep Yönlendirme | Route | amber |

`accent` örneği: `"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"`.

**`src/components/sidebar.tsx` (client):** `usePathname` ile aktif link (`/` tam eşleşme, diğerleri `startsWith`).
Masaüstünde `lg:flex` sabit 64'lük (w-64) yan menü, mobilde üst bar + hamburger ile açılan çekmece
(arka plana tıklayınca kapanır). Marka: "D" logosu, "Dalan Platform / Kontrol Paneli".

**`src/components/ui.tsx`:** `PageHeader` (title, description, icon, accent, actions), `Card` (title, action,
className), `StatCard` (label, value, hint), `Badge` (tone: green | red | amber | blue | gray; `BadgeTone` tipi export).

**`src/lib/mock-data.ts`:**
- `formatTRY` (`Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" })`), `formatDate` (medium/short).
- `accounts` (3): Ana Hesap (Vadesiz, 48.250,75), Birikim (Vadeli, 152.000), Kredi Kartı (-6.340,20).
- `transactions` (6): tarih, açıklama, kategori, tutar (+/-), durum Tamamlandı/Beklemede/Reddedildi + ton eşlemesi.
- `conversations` (3) ve `mercekStats` (bugünkü sohbet 24, token 182.400, gecikme 1350 ms).
- `teams` + saatlik ücret: Altyapı 1450, Yazılım Geliştirme 1650, Veri & Analitik 1800, Güvenlik 2100, Destek 950.
- `priorityMultiplier`: Düşük 1, Orta 1.15, Yüksek 1.35, Kritik 1.75 (+ öncelik ve durum ton eşlemeleri).
- `serviceRequests` (5): `TLP-1038`…`TLP-1042`, farklı ekip/öncelik/durum ile.

**Sayfalar**
- **Genel Bakış:** 3 modül kartı (her birinde 2 istatistik, karta tıklanınca modüle gider),
  "Son banka işlemleri" (4 satır) ve "Son talepler" (4 satır, durum rozeti).
- **Bankacılık:** 3 StatCard (toplam varlık, gelir, gider), hesap kartları, hesap hareketleri tablosu
  (yatay kaydırmalı), "Para transferi" formu (client): hesap seç, IBAN, tutar; yetersiz bakiye/geçersiz tutar kontrolü,
  başarıda "transfer talebi oluşturuldu (simülasyon)" mesajı.
- **Mercek (client `chat.tsx`):** tam yükseklik (`h-[calc(100dvh-3.5rem)] lg:h-dvh`); solda "Yeni sohbet" + son sohbetler,
  boş durumda karşılama + 4 öneri kartı, mesaj baloncukları, alt kısımda textarea (Enter gönderir, Shift+Enter satır),
  700 ms sonra sabit yanıt: "Azure AI bağlantısı henüz yapılandırılmadı…". Kodda `TODO: POST /api/mercek/chat`.
- **Talep Yönlendirme:** 3 StatCard (açık talep, efor saati, maliyet), talepler tablosu, "Yeni talep & maliyet tahmini"
  (client): açıklamadaki anahtar kelimelerle ekip önerisi —
  Güvenlik: güvenlik/şüpheli/yetki/saldırı/virüs; Altyapı: vpn/sunucu/ağ/network/disk/erişim;
  Veri & Analitik: rapor/analiz/veri/dashboard/segment; Yazılım: ekran/özellik/hata/bug/uygulama/api; varsayılan Destek.
  Ekip elle değiştirilebilir. Maliyet = saatlik ücret × saat × öncelik katsayısı (formül altında gösterilir).

### Kabul kriterleri

- `npm run build` tüm rotaları üretir; 4 sayfa 200 döner; mobilde yatay kaydırma yok.

---

## Faz 3 — Sahte kimlik doğrulama

### Copilot'a verilecek istem

> Bir fake auth sistemine ihtiyacım var. Kullanıcı bilgilerine ekranlarda (server ve client component'lerde) erişebilmeliyim.
> Önce `node_modules/next/dist/docs/01-app/02-guides/authentication.md` ve
> `authentication-with-cache-components.md` rehberlerini oku.

### Spesifikasyon

**Bağımlılık:** `npm install server-only`.

**`src/lib/auth/users.ts`** (şifre içerir, client'tan import edilmez):
- `Role = "Yönetici" | "Analist" | "Müşteri Temsilcisi"`, `User` tipi (password hariç).
- `DEMO_PASSWORD = "demo123"`. 3 kullanıcı:

| id | username | name | role | title | department | phone | customerNo | joinedAt |
|---|---|---|---|---|---|---|---|---|
| u-1 | eyup | Eyüp Dalan | Yönetici | Platform Yöneticisi | Bilgi Teknolojileri | +90 532 000 00 01 | 10000001 | 2023-02-01 |
| u-2 | ayse | Ayşe Kaya | Analist | Kıdemli İş Analisti | Veri & Analitik | +90 532 000 00 02 | 10000002 | 2024-05-13 |
| u-3 | mehmet | Mehmet Yılmaz | Müşteri Temsilcisi | Müşteri Temsilcisi | Müşteri Hizmetleri | +90 532 000 00 03 | 10000003 | 2025-09-08 |

  E-postalar `ad.soyad@dalan.dev`. (Faz 4'te müşteri alanları eklenecek.)
- Fonksiyonlar: `findUserById`, `verifyCredentials` (username küçük harfe çevrilir), `listDemoUsers` (username, name, role).
- Şifreyi ayıklarken lint uyarısı vermemek için: `const { password, ...user } = stored; void password;`

**`src/lib/auth/session.ts`** (`import "server-only"`):
- Cookie adı `session`, değeri **kullanıcı id'si** (bilinçli olarak imzasız — sahte sistem).
  `httpOnly`, `sameSite: "lax"`, `secure` production'da, `maxAge` 7 gün.
- `getCurrentUser = cache(async () => findUserById(cookie))` (React `cache`), `requireUser()` → yoksa `redirect("/giris")`.
- `createSession`, `deleteSession`.

**`src/lib/auth/actions.ts`** (`"use server"`): `login(prevState, formData)` → hata ise
`{ error: "Kullanıcı adı veya şifre hatalı.", username }`; başarıda cookie + `redirect(from)`.
`from` için güvenli yönlendirme: `/` ile başlamalı, `//` ile başlamamalı. `logout()` → cookie sil + `/giris`.

**`src/proxy.ts`:** cookie'deki id geçerli bir kullanıcı değilse ve sayfa `/giris` değilse →
`/giris?from=<path>` (kök için `from` eklenmez). Oturum varken `/giris` → `/`.
Matcher: `["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico)$).*)"]`.
(Proxy de `findUserById` kullanır; böylece bozuk cookie yönlendirme döngüsü yaratmaz.)

**`src/lib/auth/user-context.tsx`** (client) — Cache Components deseni:
```tsx
const UserContext = createContext<Promise<User> | null>(null);
export function UserProvider({ userPromise, children }) { return <UserContext value={userPromise}>{children}</UserContext>; }
export function useUser(): User { const p = use(UserContext); if (!p) throw ...; return use(p); }
```

**`src/lib/auth/format.ts`:** `getInitials(name)` (ilk 2 harf, `toLocaleUpperCase("tr-TR")`), `getFirstName`.
⚠️ Bu yardımcılar `"use client"` bir dosyada **olmamalı**; server component'ler client modülünden fonksiyon çağıramaz.

**`(dashboard)/layout.tsx`:**
```tsx
export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
function AuthenticatedShell({ children }) {
  const userPromise = requireUser();           // await ETME; promise context'e verilir
  return <UserProvider userPromise={userPromise}>…Sidebar + main…</UserProvider>;
}
```
⚠️ Layout'un en üstünde `await requireUser()` yazmak build'de
"uncached or runtime data during prerendering" hatası verir.

**`(auth)/giris/page.tsx`:** `searchParams` okuyan kısım ayrı bir async bileşende ve `<Suspense>` içinde.
`login-form.tsx` (client): `useActionState(login)`, kullanıcı adı/şifre (kontrollü), hata kutusu,
"Giriş yapılıyor…" durumu; altta demo kullanıcı listesi — tıklayınca form dolar.

**Kullanıcı bilgisi ekranlarda:**
- `components/user-menu.tsx`: `UserAvatar` (baş harfler), `UserMenu` (profil linki + `<form action={logout}>` çıkış).
  Sidebar'da masaüstünde altta, mobilde üst barda avatar + çekmecede menü.
- Genel Bakış: "Hoş geldin, {ad}" + unvan · departman (server: `await requireUser()`).
- Bankacılık başlığında ad + müşteri no; Mercek'te "Merhaba {ad}" ve mesaj yanında avatar (client: `useUser()`);
  Talep formunda "Talep sahibi: {ad} · {departman}".
- `/profil` sayfası: avatar, ad, unvan, rol rozeti, kullanıcı adı, e-posta, telefon, departman, müşteri no, katılım tarihi.

### Kabul kriterleri

- Oturumsuz `/bankacilik` → 307 `/giris?from=%2Fbankacilik`; geçersiz cookie (`session=xxx`) → `/giris`.
- `session=u-2` cookie'si ile tüm sayfalarda "Ayşe Kaya" görünür; `/giris` → `/`'ye yönlenir.
- Build'de rotalar "Partial Prerender (◐)" olarak listelenir.

---

## Faz 4 — Bankacılık işlem ekranları ve ekran kodları

### Copilot'a verilecek istem

> Bankacılık altında şu ekranlar olacak: kredi kartı başvuru, bireysel kredi kullandırım, fatura ödeme,
> müşteri bilgi güncelleme, vadesiz hesap açma. Her ekranın 8 karakterlik ekran kodu olsun:
> ilk 3 karakter modül kodu, 4. karakter T (transaction) veya R (report), son 4 karakter işlemi ifade etsin.

### Ekran kodları

| Kod | Modül (ad, ikon) | Tip | Ekran | Rota |
|---|---|---|---|---|
| `KRTTBASV` | KRT Kartlar (CreditCard) | T | Kredi Kartı Başvurusu | /bankacilik/krttbasv |
| `KRDTKULL` | KRD Krediler (HandCoins) | T | Bireysel Kredi Kullandırım | /bankacilik/krdtkull |
| `ODMTFATR` | ODM Ödemeler (Receipt) | T | Fatura Ödeme | /bankacilik/odmtfatr |
| `MUSTGUNC` | MUS Müşteri (UserPen) | T | Müşteri Bilgi Güncelleme | /bankacilik/mustgunc |
| `HSPTVDSZ` | HSP Hesaplar (Wallet) | T | Vadesiz Hesap Açılışı | /bankacilik/hsptvdsz |

Kodlarda Türkçe karakter yok; rota = kodun küçük harfi.

### Altyapı

**`src/lib/banking/screens.ts`:**
- `SCREEN_CODE_PATTERN = /^[A-Z]{3}[TR][A-Z0-9]{4}$/`, `bankingModules`, `screenTypeLabel` (T: İşlem, R: Rapor).
- `defineScreen({ code, title, description })` → format ve modül kontrolü yapar, geçersizse **throw** (build kırılır);
  `module`, `type`, `href` türetir. ⚠️ Değişken adı olarak `module` kullanma (Next ESLint kuralı) → `moduleCode`.
- `bankingScreens`, `findScreen(code)` (trim + büyük harf), `getScreen`, `findScreenByPath`.

**`src/components/banking/screen-header.tsx`:** `ScreenCode` (mono rozet), `ScreenHeader({ code })` (modül ikonu, başlık,
kod rozeti, "Modül · İşlem · açıklama").

**`src/components/banking/screen-code-bar.tsx` (client):** bankacılık sayfalarının üst çubuğu: solda breadcrumb
(Bankacılık › ekran adı), sağda "Ekran kodu" input'u (max 8, otomatik büyük harf, mono) + git butonu;
bulunamazsa kırmızı çerçeve + "Ekran bulunamadı". `bankacilik/layout.tsx` bu çubuğu render eder.

**Navigasyon:**
- `NavItem`'a `children?: { href, label, code }[]`; Bankacılık için `bankingScreens`'ten türetilir.
  Sidebar, modül aktifken alt ekranları kodlarıyla (girintili, sol çizgili liste) gösterir.
- Bankacılık ana sayfasına başlığın altına "İşlem ekranları" ızgarası (5 kart: ikon, kod rozeti, ad, açıklama, modül · tip).

**`src/components/form.tsx`:** `inputClass` (emerald odak, `read-only:bg-surface-muted`), `Field` (label + hint),
`Checkbox`, `Button` (primary emerald / secondary; varsayılan `type="button"`, props'ları spread eder),
`ResultPanel` (tone success/error/info, başlık, `rows` etiket-değer ızgarası, children).

**`src/lib/banking/utils.ts`:**
- `referenceNo(prefix)` → `KRT-20261015-482913`.
- `generateIban()` → simülasyon banka kodu **`00999`** (gerçek bankaya ait değil):
  `bban = "00999" + "0" + 16 rastgele hane`; kontrol = `98 - mod97(bban + "292700")` (TR → 29 27);
  `mod97` hane hane hesaplanır (büyük sayı taşmasın). `formatIban` 4'lü gruplar.
- `loanPlan(amount, monthlyRate, term)`: KKDF %15, BSMV %15 faiz üzerinden;
  efektif oran `r × 1.30`; taksit = `P·e / (1 − (1+e)^−n)`; her satırda faiz = bakiye × r,
  KKDF/BSMV = faiz × 0.15, anapara = taksit − faiz − vergiler (son satırda kalan bakiye);
  toplamlar ve `annualCostRate = (1+e)^12 − 1`.

**Kullanıcı modeli genişletmesi (`users.ts`):** `address {city, district, line}`, `education`, `occupation`,
`employer`, `monthlyIncome`, `permissions {sms, email, phone}`. Seed:

| user | adres | eğitim | meslek | işyeri | gelir | izinler (sms/email/phone) |
|---|---|---|---|---|---|---|
| eyup | İstanbul / Kadıköy / Caferağa Mah. Moda Cad. No: 10 | Yüksek Lisans | Yazılım Mühendisi | Dalan Yazılım | 95000 | ✓ ✓ ✗ |
| ayse | Ankara / Çankaya / Kızılay Mah. Atatürk Bulv. No: 45 | Lisans | İş Analisti | Dalan Yazılım | 62000 | ✓ ✗ ✗ |
| mehmet | İzmir / Karşıyaka / Bostanlı Mah. Cemal Gürsel Cad. No: 7 | Ön Lisans | Müşteri Temsilcisi | Dalan Yazılım | 38000 | ✗ ✓ ✓ |

- Depo bellekte, **`globalThis.__fakeUsers ??= structuredClone(seed)`** (dev'de modül yeniden yüklense de güncellemeler kalsın).
- `CustomerInfoUpdate` tipi ve `updateUser(id, changes)`. Dönüşlerde `structuredClone` (referans sızmasın).

### Ekranlar

Her ekran: `page.tsx` (server, `metadata.title = "KOD · Ad"`, `<ScreenHeader code="…"/>`) + client form bileşeni.
Formlar `useUser()` ile kullanıcı verisini önceden doldurur. Başarı/ret sonucunda `ResultPanel` ve "Yeni …" butonu.

1. **KRTTBASV** — kartlar: Klasik (limit ≤ 25.000, gelir şartı yok, ücretsiz), Gold (≤ 75.000, gelir ≥ 20.000, 650 ₺),
   Platinum (≤ 250.000, gelir ≥ 60.000, 1.450 ₺); görsel kart seçimi.
   Alanlar: çalışma durumu, meslek, işyeri, aylık net gelir, talep edilen limit, hesap kesim günü (1/5/10/15/20/25),
   teslimat (Ev/İş/Şube), KVKK + ön bilgilendirme onayları.
   Karar: gelir < alt sınır → **ret** ("INSUFFICIENT_INCOME" mantığı); aksi halde
   `onay = floor(min(talep, gelir×3, kart limiti) / 500) × 500`; onay < talep → **kısmi onay**.
2. **KRDTKULL** — tutar 5.000–500.000, vade 3/6/12/18/24/36, aylık faiz: ≤6 ay %3,09, ≤12 ay %3,29, üstü %3,49;
   tahsis ücreti binde 5; amaç; alacak hesabı (vadesiz). 4 özet kutusu (taksit, toplam, aylık faiz, yıllık maliyet) ve
   tam ödeme planı tablosu (yapışkan başlık, kaydırmalı). **Uygunluk:** taksit > gelirin %50'si → uyarı ve buton kapalı.
   Sonuç: referans, hesaba geçen (tutar − tahsis), ilk taksit tarihi (+1 ay).
3. **ODMTFATR** — türler/kurumlar: Elektrik (CK Boğaziçi Elektrik, Enerjisa Başkent, Gediz Elektrik),
   Su (İSKİ, ASKİ, İZSU), Doğalgaz (İGDAŞ, Başkentgaz, İzmirgaz), İnternet (Türk Telekom, Superonline, Turknet),
   GSM (Turkcell, Vodafone, Türk Telekom Mobil). Abone no sadece rakam (6–12).
   "Sorgula" → abone no'dan **deterministik** 1–3 fatura (seed'li PRNG; dönem, son ödeme ayın 20'si, tutar 150–2000);
   gecikmiş rozeti; checkbox ile seçim, hesap seçimi, toplam, "Öde" → bakiye yetersizse hata, değilse dekont.
   ⚠️ `new Date()`'i render'ın en üstünde değil, yalnızca etkileşimden sonra render edilen dalda kullan.
4. **MUSTGUNC** — salt okunur ad soyad ve müşteri no; düzenlenebilir: e-posta, cep telefonu, il, ilçe, açık adres,
   eğitim, meslek, işyeri, gelir, iletişim izinleri. **Server action** (`mustgunc/actions.ts`):
   e-posta regex, telefon normalizasyonu (`0532…`/`532…`/`+90 532…` → `+90 532 000 00 01` formatı),
   gelir ≥ 0; değişen alanları etiketleriyle listeler; değişiklik yoksa "Değişiklik yapılmadı.";
   `updateUser` + `refresh()` (`next/cache`) → tüm ekranlar güncel veriyi görür.
   ⚠️ React 19 `<form action>` sonrası formu sıfırlar; hata durumunda girdiler kaybolmasın diye
   `onSubmit={e => { e.preventDefault(); startTransition(() => action(new FormData(e.currentTarget))) }}` kullan.
5. **HSPTVDSZ** — döviz kartları: TRY ₺, USD $, EUR €, GBP £, XAU gr (altın); şubeler 0101 Kadıköy, 0102 Levent,
   0601 Kızılay, 3501 Alsancak, 9999 Dijital Şube (varsayılan); hesap adı (opsiyonel, varsayılan "Vadesiz {kod}"),
   amaç, fon kaynağı; müşteri özeti kartı; sözleşme + ön bilgilendirme onayı, TRY dışında ek "döviz işlem koşulları" onayı.
   Sonuç: referans, hesap no, `generateIban()` ile geçerli IBAN, açılış tarihi.

### Kabul kriterleri

- Geçersiz bir kod eklenince build hata verir.
- 1000 üretilen IBAN'ın tamamı ISO 13616 mod-97 doğrulamasından geçer.
- `loanPlan(50000, 0.0329, 12)`: son bakiye 0, anapara toplamı 50.000.
- 5 ekran oturumla 200 döner; MUSTGUNC'de değişiklik `/profil`'e yansır.

---

## Faz 5 — Kibana için sentetik log üretici

### Copilot'a verilecek istem

> Bu ekranlar için Kibana'da kullanacağım sentetik log verisine ihtiyacım var. 10.000 kayıt üreten bir
> Python script'i yaz; proje kökünde `tools/` altına koy.

### Spesifikasyon (`tools/generate_banking_logs.py`)

- **Yalnızca standart kütüphane**, Python **3.9+** uyumlu (`from __future__ import annotations`, `match`/`X | Y` runtime kullanımı yok).
  Çalıştırılabilir (`chmod +x`), shebang `#!/usr/bin/env python3`.
- CLI: `--count 10000`, `--days 30`, `--seed 42`, `--customers 800`, `--format ndjson|bulk`,
  `--index dalan-banking-logs`, `--output`, `--write-template`. Çıktı: `tools/output/<index>.ndjson`
  veya `.bulk.ndjson` (her dokümandan önce `{"index":{"_index":…}}`). `tools/output/` kök `.gitignore`'a eklenir.
- Aynı seed → aynı gün içinde birebir aynı çıktı.
- **Olay türleri:** `screen.view` (~%25, GET 200, ~120 ms) ve `transaction.complete`.
- **ECS uyumlu alanlar:** `@timestamp` (UTC, ms, `Z`), `log.level`, `message`, `service {name: dalan-banking, environment, version}`,
  `host.name` (bank-app-01..04), `event {kind, action, outcome, duration(ns)}`,
  `screen {code, name, module, module_name, type}`, `channel` (Mobil 55, İnternet Şube 25, Şube 12, Çağrı Merkezi 8),
  `customer {id, number, name, segment, age, city}`, `client {ip, geo {city_name, country_iso_code: TR, location {lat, lon}}}`,
  `user_agent.original` (kanala göre), `trace.id`, `url.path`, `http.request.method`, `http.response.status_code`,
  `transaction {id (KRT-YYYYMMDD-NNNNNN), result}`, `amount {value, currency: TRY}`, `error {code, message, type}`,
  Şube kanalında `employee.id`. Ekrana özel detaylar `banking.card | loan | bill | customer_update | account` altında.
- **Ekran ağırlıkları:** ODMTFATR 35, HSPTVDSZ 18, KRTTBASV 16, KRDTKULL 16, MUSTGUNC 15.
- **Müşteri havuzu:** Türkçe ad/soyad listeleri, segment (Bireysel 70 / Premium 25 / Özel Bankacılık 5 — medyan gelir
  32k / 85k / 250k, log-normal), 12 il (ağırlıklı, koordinat ± küçük sapma), yaşa göre meslek (≥62 Emekli, ≤24 çoğunlukla Öğrenci).
  Aktivite Pareto dağılımlı (bazı müşteriler çok aktif).
- **İş kuralları frontend ile aynı:** kart gelir şartı ve 3× gelir limiti; kredi taksiti gelirin %50'si; IBAN üretimi.
  İş reddi kodları: `INSUFFICIENT_INCOME`, `AFFORDABILITY_EXCEEDED`, `INSUFFICIENT_BALANCE` (~%6), `INSTITUTION_TIMEOUT` (~%2),
  `VALIDATION_ERROR` (~%7), `KYC_CHECK_FAILED` (~%3) → `warn`, HTTP 422, `error.type: business`.
- **Teknik hatalar (~%3):** `CORE_BANKING_TIMEOUT` (504, 5–30 sn), `SERVICE_UNAVAILABLE` (503), `DB_CONNECTION_ERROR` (500)
  → `error`, `error.type: technical`.
- **Süre:** ekran bazlı medyanlı log-normal (KRT 850, KRD 1200, ODM 650, MUS 400, HSP 950 ms).
- **Zaman:** son N güne yayılı; saatlik ağırlıklar (gece düşük, gündüz/akşam yüksek), hafta sonu ~%40 az.
  ⚠️ Saatler **Türkiye saatine (UTC+3)** göre kurgulanıp UTC'ye çevrilmeli; aksi halde Kibana'da 3 saat kayar.
- Mesajlardaki tutarlar **Türkçe sayı formatında** (`13.500 TRY`, `747,71 TRY`) — `tl()` yardımcısı.
- Mesaj formatı: `"{EKRAN_KODU} {açıklama}"`; teknik hatada kod iki kez yazılmamalı.
- `--write-template`: `index_patterns: ["<index>*"]`, string'ler keyword (dynamic template), `@timestamp: date`,
  `message: text`, `client.ip: ip`, `client.geo.location: geo_point`, `event.duration: long`, `amount.value: double`,
  `customer.age: integer`, `banking.loan.monthly_rate/debt_to_income: double`.
- `tools/README.md`: kullanım, parametre tablosu, Kibana'ya yükleme (A: arayüzden dosya yükleme; B: `_index_template` + `_bulk`),
  data view oluşturma ve kayıt yapısı.
- Ruff: `ruff check --ignore UP017` (UP017 `datetime.UTC` önerir; 3.11+ gerektirdiği için uygulanmaz).

### Kabul kriterleri

- 10.000 geçerli JSON satırı, `@timestamp` sıralı; bulk dosyası 20.000 satır.
- Tüm IBAN'lar geçerli; Türkiye saatine göre saat dağılımı gece düşük/gündüz yüksek.
- Dağılım yaklaşık: info ~%89, warn ~%9, error ~%2.

---

## Faz 6 — Azure'da Kibana yol haritası (sadece doküman)

### Copilot'a verilecek istem

> Şimdi uygulama ama bu logları Azure'da bir Kibana container'ına atmak istesem nasıl yaparım?
> Bir yol haritası çıkar ve `tools/KIBANA_AZURE_ROADMAP.md` olarak kaydet. Hiçbir kaynak oluşturma.

### İçerik başlıkları

1. Kibana'nın arkasında mutlaka Elasticsearch gerektiği notu.
2. Mimari karşılaştırma tablosu: **A. VM + Docker Compose (önerilen başlangıç)**, B. ACI, C. Container Apps,
   D. AKS + ECK, E. Elastic Cloud (Azure Marketplace). ACI/ACA'da `vm.max_map_count` ayarlanamaması ve Azure Files'ın yavaşlığı.
3. Ön hazırlık: Azure CLI, bölge, ES/Kibana **aynı sürüm** (`STACK_VERSION`), Basic lisans, Key Vault.
4. Altyapı: RG, en az 8 GB RAM VM, ayrı data disk, NSG (9200 internete kapalı, 5601 sadece kendi IP), auto-shutdown;
   taslak `az` komutları; VM'de `vm.max_map_count=262144`; tek node `docker-compose.yml` (güvenlik açık, ES `127.0.0.1:9200`),
   `kibana_system` şifresinin API ile ayarlanması; TLS için SSH tüneli veya reverse proxy.
5. Veri yükleme: SSH tüneli → template → `_bulk` → `_count`; template'in veriden önce yüklenmesi şart.
6. Kibana: data view (`dalan-banking-logs*`, `@timestamp`) ve 9 önerilen panel tablosu.
7. Tekrar üretilebilirlik: saved objects export, Bicep/Terraform, yükleme script'i, GitHub Actions.
8. Operasyon/maliyet: deallocate, snapshot (Azure Blob), sürüm güncelleme, izleme.
9. Gerçek loglara geçiş: FastAPI'de aynı ECS alan adlarıyla JSON log, Elastic Agent/OTel, data stream + ILM.

Belgenin başında "Plan — komutlar taslaktır, doğrulanmadan uygulanmamalı" uyarısı.

---

## Faz 7 — React Joyride ile senaryo simülasyonu

### Copilot'a verilecek istem

> React Joyride entegre etmek istiyorum. Bankacılık ekranlarında bazı senaryoları bununla simüle edeceğim:
> adımlar alanları kendisi doldursun, tıklasın ve sonucu göstersin.
> Önce `node_modules/react-joyride/src/types/*.ts` dosyalarını okuyarak v3 API'sini doğrula.

### Spesifikasyon

**Bağımlılık:** `npm install react-joyride@3.2.0`.
v3 API'si: `import { Joyride, EVENTS, STATUS, type Step, type EventHandler, type TooltipRenderProps } from "react-joyride"`;
`onEvent(data, controls)`; adım seçenekleri adımın kendisinde (`skipBeacon`, `before`, `beforeTimeout`, `targetWaitTimeout`),
global seçenekler `options` prop'unda (`buttons`, `closeButtonAction`, `overlayClickAction`, `primaryColor`, `arrowColor`,
`overlayColor`, `spotlightRadius`, `spotlightPadding`, `zIndex`); `loaderComponent={null}`; `tooltipComponent`.

**Hedef işaretleri:** `Field`, `Checkbox`, `ResultPanel` (`form.tsx`) ve `Card` (`ui.tsx`) bileşenlerine opsiyonel
`tour?: string` prop'u → `data-tour` attribute. `Button` zaten props'ları spread ettiği için `data-tour` doğrudan verilir.

| Ekran | data-tour hedefleri |
|---|---|
| Kod çubuğu | `code-bar-input`, `code-bar-submit` |
| KRTTBASV | `krt-products`, `krt-product-{klasik,gold,platinum}`, `krt-income`, `krt-limit`, `krt-statement-day`, `krt-consents`, `krt-kvkk`, `krt-preinfo`, `krt-submit`, `krt-result` |
| KRDTKULL | `krd-amount`, `krd-term`, `krd-account`, `krd-summary`, `krd-plan`, `krd-warning`, `krd-contract`, `krd-submit`, `krd-result` |
| ODMTFATR | `odm-category`, `odm-institution`, `odm-subscriber`, `odm-query`, `odm-bills`, `odm-account`, `odm-pay`, `odm-result` |
| MUSTGUNC | `mus-identity`, `mus-email`, `mus-city`, `mus-district`, `mus-address`, `mus-income`, `mus-permissions`, `mus-perm-email`, `mus-submit`, `mus-result` (hem başarı hem hata paneli) |
| HSPTVDSZ | `hsp-currency`, `hsp-currency-{TRY,USD,EUR,GBP,XAU}`, `hsp-branch`, `hsp-name`, `hsp-purpose`, `hsp-customer`, `hsp-contract`, `hsp-preinfo`, `hsp-fx`, `hsp-submit`, `hsp-result` |

**`src/lib/tour/actions.ts`:**
- `ScenarioAction = fill | click | check | wait`; `tourSelector(t) = [data-tour="t"]`.
- Hedef 3 sn boyunca aranır (DOM'a sonradan gelebilir). `data-tour` bir label/kapsayıcıdaysa içindeki kontrol bulunur.
- **React'in algılaması için:** prototipteki `value` setter'ı ile değer atanır
  (`Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").set.call(el, v)`), ardından
  select için `change`, input/textarea için `input` event'i (`bubbles: true`) gönderilir.
- Metin alanlarında harf harf yazma efekti (35 ms); number ve select tek seferde. Önce `scrollIntoView({ block: "center" })`.
- `check`: durum farklıysa `click()`. Her aksiyon arasında 120 ms.

**`src/lib/tour/scenarios.ts`:** `ScenarioStep {target, title, content, placement?, actions?}`,
`Scenario {id, title, description, screen: kod | null, outcome: success | rejected | info, steps}`.
**Kural:** "Gönder" tıklaması, sonuç panelini hedefleyen **son adımın** `actions`'ında yapılır
(adım, sonuç paneli DOM'a gelince gösterilir).

| id | Ekran | Özet | Değerler |
|---|---|---|---|
| krt-gold-onay | KRTTBASV | Gold kart tam onay | Gold, gelir 45000, limit 30000, kesim 15, onaylar → sonuç |
| krt-gelir-yetersiz | KRTTBASV | Platinum, gelir yetersiz → ret | Platinum, gelir 30000, limit 100000 |
| krd-36-ay | KRDTKULL | 36 ay ihtiyaç kredisi | 120000, 36 ay, özet + plan, sözleşme → sonuç |
| krd-gelir-orani | KRDTKULL | Taksit/gelir aşımı | 400000, 3 ay → `krd-warning` adımı |
| odm-dogalgaz | ODMTFATR | Doğalgaz faturası | Doğalgaz, Başkentgaz, 4012345678, Sorgula, hesap, Öde |
| mus-adres | MUSTGUNC | Adres değişikliği | İstanbul, Beşiktaş, "Sinanpaşa Mah. Ihlamurdere Cad. No: 12", e-posta izni |
| hsp-usd | HSPTVDSZ | USD hesap açılışı | USD, şube 0102, "Dolar Birikim", 3 onay → sonuç |
| ekran-kodu | (null) | Kodla ekran açma | `ODMTFATR` yaz, git → `odm-category` |

**`src/components/tour/scenario-provider.tsx` (client):** context: `active`, `autoplay`, `setAutoplay`, `start(id)`, `stop()`.
- Adım dönüşümü: `target: tourSelector(...)`, `placement ?? "auto"`, `skipBeacon: true`,
  `before: () => runActions(actions)`, `beforeTimeout: 30000`, `targetWaitTimeout: 5000`.
- `start`: senaryo başka ekrandaysa `router.push(href)`; `setActive` ve `runId++`.
  `ready = active && (!href || pathname === href)` — **türetilmiş değer**, `useEffect` içinde setState **yok**
  (React lint kuralı). Joyride `run={ready}`.
- `runId`: children `<div key={runId} className="contents">` ile sarılır → her başlatmada ekran yeniden mount edilir
  (form state sıfırlanır); Joyride da `key={runId}`.
- `onEvent`: `TOOLTIP` + autoplay → 3500 ms sonra `controls.next()`; `STEP_AFTER`/`TOUR_END` → timer temizle;
  `TOUR_END` veya `SKIPPED` → `active = null`; `TARGET_NOT_FOUND`/`ERROR` → `console.warn("[senaryo]", …)`.
- Joyride: `continuous`, `scrollToFirstStep`, `loaderComponent={null}`, `options`:
  `buttons: ["skip","primary"]`, `closeButtonAction: "skip"`, `overlayClickAction: false`,
  `overlayColor: "rgba(0,0,0,0.45)"`, `arrowColor: "var(--surface)"`, `primaryColor: "#059669"`,
  `spotlightRadius: 10`, `spotlightPadding: 6`, `zIndex: 1000`.

**`scenario-tooltip.tsx`:** tema token'larıyla (açık/koyu) kart; üstte ilerleme çubuğu, "Adım x / n", başlık, içerik,
X (skipProps — senaryoyu bitirir), "İleri"/"Bitir" (primaryProps); `tooltipProps` kapsayıcıya spread edilir.

**`scenario-launcher.tsx`:** kod çubuğunda "Senaryolar" (Theater ikonu) açılır menü: mevcut ekranın senaryoları üstte,
her satırda başlık, sonuç rozeti (Başarılı/Ret/Bilgi), açıklama, ekran kodu; başlıkta "Otomatik oynat" kutusu.
Senaryo çalışırken buton, senaryo adını gösteren bir "durdur" butonuna dönüşür.

**`bankacilik/layout.tsx`:** `<ScenarioProvider toolbar={<ScreenCodeBar />}>{children}</ScenarioProvider>`
(çubuk key'li alanın dışında kalır; menü state'i sıfırlanmaz).

### Kabul kriterleri

- Senaryolardaki her `target` değeri kodda bir `data-tour`/`tour` olarak mevcut (script ile kontrol et).
- Senaryoların seçtiği değerler (Başkentgaz, 36, 0102, İstanbul, 15) ilgili seçeneklerde mevcut.
- **Tarayıcıda elle doğrula** (`npm run dev`): her senaryo baştan sona çalışır, alanlar dolar, sonuç paneli gösterilir;
  "Otomatik oynat" adımları ilerletir; X senaryoyu durdurur; aynı senaryo tekrar başlatıldığında form temizdir.

---

## Bilinen sınırlamalar (bilinçli tercihler)

- Kimlik doğrulama sahte: cookie imzasız (değeri `u-1` yapan o kullanıcı olur), kullanıcının tüm alanları client'a gider.
- Kullanıcı güncellemeleri bellekte; sunucu yeniden başlayınca seed'e döner.
- KRT/KRD/ODM/HSP ekranları sonuç üretir ama hesap bakiyelerini/listelerini değiştirmez.
- Mercek, Azure AI'ya bağlı değil (sabit yanıt).
- Transfer formu ve talep formu ortak `form.tsx` bileşenlerini henüz kullanmıyor.

## Önerilen sonraki adımlar

1. Mercek'i backend üzerinden Azure OpenAI'ya bağlamak (streaming yanıtla); endpoint, deployment adı ve anahtar gerekir.
2. Bankacılık işlemlerini FastAPI'ye taşıyıp kalıcı hale getirmek (hesap, işlem, fatura uç noktaları).
3. Backend'de sentetik veriyle aynı ECS alan adlarıyla JSON loglama → Kibana dashboard'ları gerçek veriyle çalışır.
4. Senaryolar için Playwright ile uçtan uca test.
