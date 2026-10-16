# Tools

## generate_banking_logs.py

Bankacılık ekranları (KRTTBASV, KRDTKULL, ODMTFATR, MUSTGUNC, HSPTVDSZ) için Kibana'ya
yüklenecek sentetik uygulama logu üretir. Yalnızca standart kütüphane kullanır (Python 3.9+).

```bash
python3 tools/generate_banking_logs.py                    # 10.000 kayıt → tools/output/dalan-banking-logs.ndjson
python3 tools/generate_banking_logs.py --format bulk      # Elasticsearch _bulk formatı
python3 tools/generate_banking_logs.py --write-template   # index template JSON'u da yazar
python3 tools/generate_banking_logs.py --count 50000 --days 90 --seed 7
```

| Parametre | Varsayılan | Açıklama |
|---|---|---|
| `--count` | 10000 | Kayıt sayısı |
| `--days` | 30 | Bugünden geriye kaç güne yayılacağı |
| `--seed` | 42 | Aynı seed aynı gün içinde aynı veriyi üretir |
| `--customers` | 800 | Müşteri havuzu büyüklüğü |
| `--format` | `ndjson` | `ndjson` (Kibana dosya yükleme) veya `bulk` (`_bulk` API) |
| `--index` | `dalan-banking-logs` | Index adı |

### Kibana'ya yükleme

**A) Kibana arayüzünden:** *Integrations → Upload a file* → `dalan-banking-logs.ndjson`.
Bu yolda index Kibana tarafından oluşturulur; `client.geo.location` alanını `geo_point` olarak
işaretlemeyi unutmayın (harita görselleştirmesi için).

**B) Elasticsearch API ile (önerilen, mapping'ler doğru gelir):**

```bash
ES=http://localhost:9200

# 1. Index template (geo_point, ip, sayısal alanlar)
python3 tools/generate_banking_logs.py --format bulk --write-template
curl -X PUT "$ES/_index_template/dalan-banking-logs" \
  -H 'Content-Type: application/json' \
  --data-binary @tools/output/dalan-banking-logs.template.json

# 2. Veriyi yükle
curl -X POST "$ES/_bulk?refresh=true" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @tools/output/dalan-banking-logs.bulk.ndjson | head -c 200
```

Ardından Kibana'da *Stack Management → Data Views* altında `dalan-banking-logs*` için
zaman alanı `@timestamp` olan bir data view oluşturun.

### Kayıt yapısı

- `event.action`: `screen.view` (~%25) veya `transaction.complete`
- `event.outcome`: `success` / `failure` · `event.duration`: nanosaniye (ECS)
- `transaction.result`: `success`, `partial`, `rejected` (iş kuralı), `error` (teknik)
- `log.level`: `info`, `warn` (iş kuralı reddi, HTTP 422), `error` (teknik hata, HTTP 5xx)
- `screen.*`: ekran kodu, adı, modül kodu/adı, tipi (`T`/`R`)
- `customer.*`, `channel`, `client.geo.*`, `user_agent.original`, `trace.id`
- `amount.value`: parasal işlemlerde TRY tutar
- `error.code` / `error.type`: `business` (ör. `INSUFFICIENT_INCOME`) veya `technical` (ör. `CORE_BANKING_TIMEOUT`)
- `banking.<card|loan|bill|customer_update|account>`: ekrana özel detaylar

Zaman dağılımı Türkiye saatine (UTC+3) göre kurgulanır: gece düşük, gündüz ve akşam yoğun,
hafta sonu daha az trafik. Kayıtlar `@timestamp`'e göre sıralıdır.
