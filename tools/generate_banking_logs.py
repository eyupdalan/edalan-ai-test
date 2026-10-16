#!/usr/bin/env python3
"""Bankacılık ekranları için Kibana'ya yüklenecek sentetik log üretir.

Her kayıt bir uygulama log olayıdır (ECS uyumlu alan adlarıyla):
  - screen.view           : ekranın açılması
  - transaction.complete  : işlemin sonucu (başarılı / iş kuralı reddi / teknik hata)

Ekranlar: KRTTBASV, KRDTKULL, ODMTFATR, MUSTGUNC, HSPTVDSZ

Kullanım:
  python3 tools/generate_banking_logs.py                     # 10.000 kayıt, NDJSON
  python3 tools/generate_banking_logs.py --format bulk       # Elasticsearch _bulk formatı
  python3 tools/generate_banking_logs.py --count 50000 --days 90 --seed 7
  python3 tools/generate_banking_logs.py --write-template    # index template JSON'u da yazar

Yalnızca standart kütüphane kullanır (Python 3.9+).
"""

from __future__ import annotations

import argparse
import json
import math
import random
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

SERVICE = {"name": "dalan-banking", "environment": "production", "version": "1.4.2"}
HOSTS = ["bank-app-01", "bank-app-02", "bank-app-03", "bank-app-04"]
SIM_BANK_CODE = "00999"  # Gerçek bir bankaya ait değildir.
TR_TZ = timezone(timedelta(hours=3))  # Saat dağılımı Türkiye saatine göre kurgulanır.

SCREENS = {
    "KRTTBASV": {"name": "Kredi Kartı Başvurusu", "module": "KRT", "module_name": "Kartlar"},
    "KRDTKULL": {"name": "Bireysel Kredi Kullandırım", "module": "KRD", "module_name": "Krediler"},
    "ODMTFATR": {"name": "Fatura Ödeme", "module": "ODM", "module_name": "Ödemeler"},
    "MUSTGUNC": {"name": "Müşteri Bilgi Güncelleme", "module": "MUS", "module_name": "Müşteri"},
    "HSPTVDSZ": {"name": "Vadesiz Hesap Açılışı", "module": "HSP", "module_name": "Hesaplar"},
}
SCREEN_WEIGHTS = {"ODMTFATR": 35, "HSPTVDSZ": 18, "KRTTBASV": 16, "KRDTKULL": 16, "MUSTGUNC": 15}
VIEW_RATIO = 0.25  # Kayıtların yaklaşık %25'i ekran açılışı

CHANNELS = {"Mobil": 55, "İnternet Şube": 25, "Şube": 12, "Çağrı Merkezi": 8}

# (şehir, ağırlık, enlem, boylam)
CITIES = [
    ("İstanbul", 30, 41.0082, 28.9784),
    ("Ankara", 12, 39.9334, 32.8597),
    ("İzmir", 9, 38.4237, 27.1428),
    ("Bursa", 6, 40.1885, 29.0610),
    ("Antalya", 5, 36.8969, 30.7133),
    ("Adana", 4, 37.0000, 35.3213),
    ("Konya", 4, 37.8746, 32.4932),
    ("Kocaeli", 4, 40.8533, 29.8815),
    ("Gaziantep", 4, 37.0662, 37.3833),
    ("Kayseri", 3, 38.7205, 35.4826),
    ("Eskişehir", 3, 39.7767, 30.5206),
    ("Trabzon", 2, 41.0027, 39.7168),
]

FIRST_NAMES = [
    "Ahmet",
    "Mehmet",
    "Mustafa",
    "Ali",
    "Hüseyin",
    "Hasan",
    "İbrahim",
    "Murat",
    "Emre",
    "Burak",
    "Can",
    "Eyüp",
    "Oğuz",
    "Serkan",
    "Kemal",
    "Ayşe",
    "Fatma",
    "Emine",
    "Hatice",
    "Zeynep",
    "Elif",
    "Merve",
    "Esra",
    "Selin",
    "Deniz",
    "Gizem",
    "Büşra",
    "Şeyma",
    "Ceren",
    "Derya",
]
LAST_NAMES = [
    "Yılmaz",
    "Kaya",
    "Demir",
    "Şahin",
    "Çelik",
    "Yıldız",
    "Yıldırım",
    "Öztürk",
    "Aydın",
    "Özdemir",
    "Arslan",
    "Doğan",
    "Kılıç",
    "Aslan",
    "Çetin",
    "Kara",
    "Koç",
    "Kurt",
    "Özkan",
    "Dalan",
]
OCCUPATIONS = [
    "Mühendis",
    "Öğretmen",
    "Doktor",
    "Hemşire",
    "Avukat",
    "Muhasebeci",
    "Satış Temsilcisi",
    "Esnaf",
    "Memur",
    "Yazılım Geliştirici",
    "Teknisyen",
    "Emekli",
    "Öğrenci",
    "Serbest Meslek",
]
SEGMENTS = {"Bireysel": (70, 32_000), "Premium": (25, 85_000), "Özel Bankacılık": (5, 250_000)}

USER_AGENTS = {
    "Mobil": [
        "DalanBank/5.12.0 (iPhone; iOS 19.1)",
        "DalanBank/5.12.0 (Android 16; SM-S931B)",
        "DalanBank/5.11.3 (Android 15; Pixel 9)",
    ],
    "İnternet Şube": [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_6) AppleWebKit/605.1.15 Version/19.0 Safari/605.1.15",
    ],
    "Şube": ["DalanBranchTerminal/3.4 (Windows NT 10.0)"],
    "Çağrı Merkezi": ["DalanCallCenter/2.8 (Windows NT 10.0)"],
}

# Teknik hatalar: (kod, mesaj, http durumu, ağırlık)
TECH_ERRORS = [
    ("CORE_BANKING_TIMEOUT", "Ana bankacılık servisi zaman aşımına uğradı", 504, 5),
    ("SERVICE_UNAVAILABLE", "Bağımlı servis geçici olarak kullanılamıyor", 503, 3),
    ("DB_CONNECTION_ERROR", "Veritabanı bağlantı havuzu tükendi", 500, 2),
]
TECH_ERROR_RATE = 0.03

# Ekran bazlı ortalama süre (ms) — log-normal dağılımın medyanı
MEDIAN_DURATION_MS = {
    "KRTTBASV": 850,
    "KRDTKULL": 1200,
    "ODMTFATR": 650,
    "MUSTGUNC": 400,
    "HSPTVDSZ": 950,
}

# Saatlik yoğunluk (0-23); gece düşük, öğlen ve akşam yüksek
HOURLY_WEIGHTS = [
    1,
    1,
    1,
    1,
    1,
    2,
    4,
    7,
    10,
    12,
    13,
    13,
    14,
    13,
    12,
    12,
    12,
    12,
    13,
    14,
    13,
    10,
    6,
    3,
]


def weighted_choice(rng: random.Random, weights: dict):
    keys = list(weights)
    return rng.choices(keys, weights=[weights[k] for k in keys])[0]


def round_to(value: float, step: float) -> float:
    return round(value / step) * step


def money(value: float) -> float:
    return round(value, 2)


def tl(value: float, decimals: int = 0) -> str:
    """Türkçe sayı formatı: 1234567.8 → '1.234.567,80'"""
    text = f"{value:,.{decimals}f}"
    return text.replace(",", "_").replace(".", ",").replace("_", ".")


# --- Müşteri havuzu --------------------------------------------------------------


def build_customers(rng: random.Random, size: int) -> list:
    customers = []
    city_weights = [c[1] for c in CITIES]
    for i in range(size):
        segment = weighted_choice(rng, {k: v[0] for k, v in SEGMENTS.items()})
        median_income = SEGMENTS[segment][1]
        city = rng.choices(CITIES, weights=city_weights)[0]
        age = rng.randint(18, 75)
        if age >= 62:
            occupation = "Emekli"
        elif age <= 24 and rng.random() < 0.6:
            occupation = "Öğrenci"
        else:
            occupation = rng.choice([o for o in OCCUPATIONS if o not in ("Emekli", "Öğrenci")])
        customers.append(
            {
                "id": f"c-{i + 1:05d}",
                "number": str(20_000_000 + i * 7 + rng.randint(0, 6)),
                "name": f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}",
                "age": age,
                "segment": segment,
                "occupation": occupation,
                "monthly_income": round_to(median_income * rng.lognormvariate(0, 0.45), 500),
                "city": city[0],
                "location": {
                    "lat": round(city[2] + rng.uniform(-0.15, 0.15), 5),
                    "lon": round(city[3] + rng.uniform(-0.15, 0.15), 5),
                },
            }
        )
    return customers


# --- Zaman dağılımı --------------------------------------------------------------


def random_timestamp(rng: random.Random, start: datetime, days: int) -> datetime:
    while True:
        day = start + timedelta(days=rng.randrange(days))
        # Hafta sonu trafiği yaklaşık %40 daha düşük
        if day.weekday() >= 5 and rng.random() < 0.4:
            continue
        hour = rng.choices(range(24), weights=HOURLY_WEIGHTS)[0]
        local = day.replace(
            hour=hour,
            minute=rng.randrange(60),
            second=rng.randrange(60),
            microsecond=rng.randrange(1000) * 1000,
        )
        return local.astimezone(timezone.utc)


# --- Ekran bazlı iş mantığı --------------------------------------------------------
# Her fonksiyon (detaylar, sonuç, mesaj, tutar, iş hatası) döner.
# Sonuç: "success" | "partial" | "rejected"


def reference_no(rng: random.Random, prefix: str, ts: datetime) -> str:
    return f"{prefix}-{ts:%Y%m%d}-{rng.randrange(1_000_000):06d}"


def screen_credit_card(rng: random.Random, customer: dict):
    products = {"Klasik": (25_000, 0), "Gold": (75_000, 20_000), "Platinum": (250_000, 60_000)}
    product = weighted_choice(rng, {"Klasik": 45, "Gold": 40, "Platinum": 15})
    max_limit, min_income = products[product]
    income = customer["monthly_income"]
    requested = round_to(rng.uniform(5_000, max_limit), 500)
    details = {
        "product": product,
        "requested_limit": requested,
        "declared_income": income,
        "statement_day": rng.choice([1, 5, 10, 15, 20, 25]),
        "employment": "Emekli"
        if customer["occupation"] == "Emekli"
        else rng.choice(["Özel sektör", "Kamu", "Serbest meslek"]),
    }
    if income < min_income:
        details["decision"] = "rejected"
        details["reject_reason"] = "INSUFFICIENT_INCOME"
        msg = f"Kredi kartı başvurusu reddedildi: gelir yetersiz ({product})"
        return details, "rejected", msg, None, ("INSUFFICIENT_INCOME", "Gelir, kart için alt sınırın altında")

    approved = math.floor(min(requested, income * 3, max_limit) / 500) * 500
    details["approved_limit"] = approved
    status = "partial" if approved < requested else "success"
    details["decision"] = "partial" if status == "partial" else "approved"
    msg = f"Kredi kartı başvurusu {'kısmi ' if status == 'partial' else ''}onaylandı ({product}, limit {tl(approved)} TRY)"
    return details, status, msg, approved, None


def loan_installment(amount: float, monthly_rate: float, term: int) -> float:
    effective = monthly_rate * 1.30  # KKDF %15 + BSMV %15
    return amount * effective / (1 - (1 + effective) ** -term)


def screen_loan(rng: random.Random, customer: dict):
    term = rng.choice([3, 6, 12, 12, 18, 24, 24, 36])
    rate = 0.0309 if term <= 6 else 0.0329 if term <= 12 else 0.0349
    amount = round_to(min(500_000, max(5_000, customer["monthly_income"] * rng.uniform(0.5, 6))), 1000)
    installment = loan_installment(amount, rate, term)
    details = {
        "amount": amount,
        "term_months": term,
        "monthly_rate": rate,
        "installment": money(installment),
        "total_payment": money(installment * term),
        "allocation_fee": money(amount * 0.005),
        "purpose": rng.choice(["İhtiyaç", "Eğitim", "Sağlık", "Tatil", "Beyaz eşya / Elektronik", "Diğer"]),
        "debt_to_income": round(installment / customer["monthly_income"], 3),
    }
    if installment > customer["monthly_income"] * 0.5:
        msg = f"Kredi kullandırım reddedildi: taksit gelirin %50'sini aşıyor ({tl(amount)} TRY / {term} ay)"
        return (
            details,
            "rejected",
            msg,
            amount,
            ("AFFORDABILITY_EXCEEDED", "Taksit/gelir oranı limiti aşıldı"),
        )
    msg = f"Bireysel kredi kullandırıldı ({tl(amount)} TRY, {term} ay, taksit {tl(installment, 2)} TRY)"
    return details, "success", msg, amount, None


BILL_INSTITUTIONS = {
    "Elektrik": ["CK Boğaziçi Elektrik", "Enerjisa Başkent", "Gediz Elektrik"],
    "Su": ["İSKİ", "ASKİ", "İZSU"],
    "Doğalgaz": ["İGDAŞ", "Başkentgaz", "İzmirgaz"],
    "İnternet": ["Türk Telekom", "Superonline", "Turknet"],
    "GSM": ["Turkcell", "Vodafone", "Türk Telekom Mobil"],
}
BILL_RANGES = {
    "Elektrik": (250, 2500),
    "Su": (120, 900),
    "Doğalgaz": (200, 4500),
    "İnternet": (300, 900),
    "GSM": (200, 1200),
}


def screen_bill(rng: random.Random, customer: dict):
    category = weighted_choice(rng, {"Elektrik": 30, "Doğalgaz": 20, "Su": 15, "GSM": 20, "İnternet": 15})
    low, high = BILL_RANGES[category]
    count = rng.choices([1, 2, 3], weights=[75, 20, 5])[0]
    amounts = [money(rng.uniform(low, high)) for _ in range(count)]
    total = money(sum(amounts))
    details = {
        "category": category,
        "institution": rng.choice(BILL_INSTITUTIONS[category]),
        "subscriber_no": str(rng.randrange(10**9, 10**10)),
        "bill_count": count,
        "overdue_count": sum(1 for _ in range(count) if rng.random() < 0.15),
        "total_amount": total,
    }
    if rng.random() < 0.06:
        msg = f"Fatura ödemesi başarısız: yetersiz bakiye ({details['institution']}, {tl(total, 2)} TRY)"
        return details, "rejected", msg, total, ("INSUFFICIENT_BALANCE", "Hesap bakiyesi yetersiz")
    if rng.random() < 0.02:
        msg = f"Fatura ödemesi başarısız: kurum yanıt vermedi ({details['institution']})"
        return details, "rejected", msg, total, ("INSTITUTION_TIMEOUT", "Kurum servisi yanıt vermedi")
    msg = f"Fatura ödendi ({details['institution']}, {count} adet, {tl(total, 2)} TRY)"
    return details, "success", msg, total, None


CUSTOMER_FIELDS = [
    "email",
    "phone",
    "address",
    "education",
    "occupation",
    "employer",
    "monthly_income",
    "permissions",
]


def screen_customer_update(rng: random.Random, customer: dict):
    changed = rng.sample(CUSTOMER_FIELDS, k=rng.choices([1, 2, 3, 4], weights=[50, 30, 15, 5])[0])
    details = {"changed_fields": sorted(changed), "changed_field_count": len(changed)}
    if rng.random() < 0.07:
        field = rng.choice(["email", "phone"])
        details["invalid_field"] = field
        msg = f"Müşteri bilgi güncelleme doğrulama hatası: {field}"
        return details, "rejected", msg, None, ("VALIDATION_ERROR", f"Geçersiz {field} formatı")
    msg = f"Müşteri bilgileri güncellendi ({', '.join(sorted(changed))})"
    return details, "success", msg, None, None


def generate_iban(rng: random.Random) -> str:
    bban = f"{SIM_BANK_CODE}0{rng.randrange(10**16):016d}"
    numeric = bban + "292700"  # "TR00" sona taşınır; T=29, R=27
    check = 98 - int(numeric) % 97
    return f"TR{check:02d}{bban}"


BRANCHES = [
    ("0101", "Kadıköy Şubesi"),
    ("0102", "Levent Şubesi"),
    ("0601", "Kızılay Şubesi"),
    ("3501", "Alsancak Şubesi"),
    ("9999", "Dijital Şube"),
]


def screen_account_open(rng: random.Random, customer: dict):
    currency = weighted_choice(rng, {"TRY": 60, "USD": 15, "EUR": 12, "XAU": 10, "GBP": 3})
    branch = rng.choice(BRANCHES)
    details = {
        "currency": currency,
        "branch_code": branch[0],
        "branch_name": branch[1],
        "purpose": rng.choice(["Maaş / Gelir", "Birikim", "Ticari işlemler", "Yatırım", "Fatura ödemeleri"]),
        "fund_source": rng.choice(["Maaş", "Serbest meslek kazancı", "Kira geliri", "Emekli maaşı", "Diğer"]),
    }
    if rng.random() < 0.03:
        msg = "Vadesiz hesap açılışı reddedildi: KYC kontrolü tamamlanamadı"
        return details, "rejected", msg, None, ("KYC_CHECK_FAILED", "Müşteri tanıma kontrolü başarısız")
    details["iban"] = generate_iban(rng)
    msg = f"Vadesiz {currency} hesap açıldı ({branch[1]})"
    return details, "success", msg, None, None


SCREEN_HANDLERS = {
    "KRTTBASV": ("card", "KRT", screen_credit_card),
    "KRDTKULL": ("loan", "KRD", screen_loan),
    "ODMTFATR": ("bill", "ODM", screen_bill),
    "MUSTGUNC": ("customer_update", "MUS", screen_customer_update),
    "HSPTVDSZ": ("account", "HSP", screen_account_open),
}


# --- Log kaydı ------------------------------------------------------------------------


def random_ip(rng: random.Random, channel: str) -> str:
    if channel in ("Şube", "Çağrı Merkezi"):
        return f"10.{rng.randint(10, 40)}.{rng.randint(0, 255)}.{rng.randint(1, 254)}"
    return f"{rng.choice([78, 85, 88, 95, 176, 212])}.{rng.randint(0, 255)}.{rng.randint(0, 255)}.{rng.randint(1, 254)}"


def make_event(rng: random.Random, ts: datetime, customer: dict, screen_code: str, is_view: bool) -> dict:
    screen = SCREENS[screen_code]
    channel = weighted_choice(rng, CHANNELS)
    url_path = f"/bankacilik/{screen_code.lower()}"

    event = {
        "@timestamp": ts.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "service": SERVICE,
        "host": {"name": rng.choice(HOSTS)},
        "screen": {
            "code": screen_code,
            "name": screen["name"],
            "module": screen["module"],
            "module_name": screen["module_name"],
            "type": screen_code[3],
        },
        "channel": channel,
        "customer": {
            "id": customer["id"],
            "number": customer["number"],
            "name": customer["name"],
            "segment": customer["segment"],
            "age": customer["age"],
            "city": customer["city"],
        },
        "client": {
            "ip": random_ip(rng, channel),
            "geo": {
                "city_name": customer["city"],
                "country_iso_code": "TR",
                "location": customer["location"],
            },
        },
        "user_agent": {"original": rng.choice(USER_AGENTS[channel])},
        "trace": {"id": uuid.UUID(int=rng.getrandbits(128)).hex},
        "url": {"path": url_path},
    }
    if channel == "Şube":
        event["employee"] = {"id": f"P{rng.randint(1000, 1099)}"}

    if is_view:
        duration_ms = rng.lognormvariate(math.log(120), 0.5)
        event.update(
            {
                "log": {"level": "info"},
                "message": f"{screen_code} ekranı açıldı: {screen['name']}",
                "event": {
                    "kind": "event",
                    "action": "screen.view",
                    "outcome": "success",
                    "duration": int(duration_ms * 1_000_000),
                },
                "http": {"request": {"method": "GET"}, "response": {"status_code": 200}},
            }
        )
        return event

    detail_key, prefix, handler = SCREEN_HANDLERS[screen_code]
    details, status, message, amount, business_error = handler(rng, customer)
    duration_ms = rng.lognormvariate(math.log(MEDIAN_DURATION_MS[screen_code]), 0.55)

    if rng.random() < TECH_ERROR_RATE:
        code, err_msg, http_status, _ = rng.choices(TECH_ERRORS, weights=[e[3] for e in TECH_ERRORS])[0]
        duration_ms = max(duration_ms, rng.uniform(5_000, 30_000)) if http_status == 504 else duration_ms
        level, outcome, result = "error", "failure", "error"
        message = f"işlemi başarısız: {err_msg}"
        error = {"code": code, "message": err_msg, "type": "technical"}
    elif business_error:
        http_status, level, outcome, result = 422, "warn", "failure", "rejected"
        error = {"code": business_error[0], "message": business_error[1], "type": "business"}
    else:
        http_status, level, outcome, result = 200, "info", "success", status
        error = None

    event.update(
        {
            "log": {"level": level},
            "message": f"{screen_code} {message}",
            "event": {
                "kind": "event",
                "action": "transaction.complete",
                "outcome": outcome,
                "duration": int(duration_ms * 1_000_000),
            },
            "http": {"request": {"method": "POST"}, "response": {"status_code": http_status}},
            "transaction": {"id": reference_no(rng, prefix, ts), "result": result},
            "banking": {detail_key: details},
        }
    )
    if amount is not None:
        event["amount"] = {"value": money(amount), "currency": "TRY"}
    if error:
        event["error"] = error
    return event


def generate(count: int, days: int, seed: int, customer_pool: int) -> list:
    rng = random.Random(seed)
    customers = build_customers(rng, customer_pool)
    # Müşterilerin bir kısmı çok daha aktif (Pareto benzeri)
    activity = [rng.paretovariate(1.5) for _ in customers]
    end = datetime.now(TR_TZ).replace(hour=0, minute=0, second=0, microsecond=0)
    start = end - timedelta(days=days)

    events = []
    for _ in range(count):
        ts = random_timestamp(rng, start, days)
        customer = rng.choices(customers, weights=activity)[0]
        screen_code = weighted_choice(rng, SCREEN_WEIGHTS)
        events.append(make_event(rng, ts, customer, screen_code, rng.random() < VIEW_RATIO))
    events.sort(key=lambda e: e["@timestamp"])
    return events


# --- Index template -----------------------------------------------------------------


def index_template(index: str) -> dict:
    return {
        "index_patterns": [f"{index}*"],
        "template": {
            "settings": {"number_of_shards": 1, "number_of_replicas": 0},
            "mappings": {
                "dynamic_templates": [
                    {
                        "strings_as_keyword": {
                            "match_mapping_type": "string",
                            "mapping": {"type": "keyword", "ignore_above": 1024},
                        }
                    }
                ],
                "properties": {
                    "@timestamp": {"type": "date"},
                    "message": {"type": "text"},
                    "client": {
                        "properties": {
                            "ip": {"type": "ip"},
                            "geo": {"properties": {"location": {"type": "geo_point"}}},
                        }
                    },
                    "event": {"properties": {"duration": {"type": "long"}}},
                    "amount": {"properties": {"value": {"type": "double"}}},
                    "customer": {"properties": {"age": {"type": "integer"}}},
                    "banking": {
                        "properties": {
                            "loan": {
                                "properties": {
                                    "monthly_rate": {"type": "double"},
                                    "debt_to_income": {"type": "double"},
                                }
                            },
                        }
                    },
                },
            },
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Bankacılık ekranları için sentetik Kibana logu üretir.")
    parser.add_argument(
        "--count", type=int, default=10_000, help="Üretilecek kayıt sayısı (varsayılan: 10000)"
    )
    parser.add_argument("--days", type=int, default=30, help="Geriye dönük gün sayısı (varsayılan: 30)")
    parser.add_argument(
        "--seed", type=int, default=42, help="Tekrarlanabilir sonuç için seed (varsayılan: 42)"
    )
    parser.add_argument(
        "--customers", type=int, default=800, help="Müşteri havuzu büyüklüğü (varsayılan: 800)"
    )
    parser.add_argument(
        "--format",
        choices=["ndjson", "bulk"],
        default="ndjson",
        help="ndjson: Kibana dosya yükleme · bulk: Elasticsearch _bulk API",
    )
    parser.add_argument("--index", default="dalan-banking-logs", help="Index adı (bulk ve template için)")
    parser.add_argument(
        "--output", type=Path, help="Çıktı dosyası (varsayılan: tools/output/<index>.<format>)"
    )
    parser.add_argument(
        "--write-template", action="store_true", help="Index template JSON'unu da tools/output altına yazar"
    )
    args = parser.parse_args()

    out_dir = Path(__file__).resolve().parent / "output"
    output = args.output or out_dir / f"{args.index}.{'ndjson' if args.format == 'ndjson' else 'bulk.ndjson'}"
    output.parent.mkdir(parents=True, exist_ok=True)

    events = generate(args.count, args.days, args.seed, args.customers)
    with output.open("w", encoding="utf-8") as f:
        for event in events:
            if args.format == "bulk":
                f.write(json.dumps({"index": {"_index": args.index}}) + "\n")
            f.write(json.dumps(event, ensure_ascii=False) + "\n")

    print(f"{len(events)} kayıt yazıldı → {output}")

    if args.write_template:
        template_path = out_dir / f"{args.index}.template.json"
        template_path.write_text(
            json.dumps(index_template(args.index), ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"Index template yazıldı → {template_path}")


if __name__ == "__main__":
    main()
