# Yol Haritası: Sentetik Bankacılık Loglarını Azure'da Kibana'ya Taşımak

> Durum: **Plan.** Henüz hiçbir Azure kaynağı oluşturulmadı. Komutlar taslaktır;
> uygulamadan önce güncel Azure CLI ve Elastic dokümantasyonuyla doğrulayın.

Veri kaynağı: `tools/generate_banking_logs.py` → `tools/output/dalan-banking-logs.bulk.ndjson`
ve `dalan-banking-logs.template.json` (bkz. [README.md](README.md)).

Kibana tek başına veri tutmaz; arkasında her zaman bir **Elasticsearch** gerekir.
Bu yüzden "Kibana container'ı" aslında **Elasticsearch + Kibana** ikilisini kurmak demektir.

---

## 1. Mimari seçimi

| Seçenek | Ne zaman | Artı | Eksi |
|---|---|---|---|
| **A. Azure VM + Docker Compose** | Demo / PoC (**önerilen başlangıç**) | En basit, tam kontrol, `vm.max_map_count` ayarlanabilir, kalıcı managed disk | Sunucu bakımı (güncelleme, yedek) sizde |
| B. Azure Container Instances (ACI) | Kısa ömürlü demo, VM istemiyorsanız | Sunucu yönetimi yok, saniyelik ücret | Kernel ayarı yapılamaz (`node.store.allow_mmap: false` gerekir), Azure Files (SMB) Elasticsearch için yavaş, yeniden başlatmada IP değişebilir |
| C. Azure Container Apps | Kibana'yı ölçeklemek istiyorsanız | Yönetilen ingress + TLS | Elasticsearch için uygun değil (kalıcı disk ve kernel ayarı kısıtlı); ES'yi başka yerde tutmak gerekir |
| D. AKS + ECK (Elastic Cloud on Kubernetes) | Üretim, çok node'lu küme | Operator ile yükseltme, ölçekleme, TLS otomatik | Kubernetes bilgisi ve maliyeti gerektirir |
| E. Elastic Cloud (Azure Marketplace üzerinden) | Üretim, yönetilen hizmet isteniyorsa | Kurulum/bakım yok, Azure faturasına eklenir | Container değil, yönetilen servis; aylık maliyet daha yüksek |

**Öneri:** Önce **A** ile 1 VM üzerinde ayağa kaldırıp dashboard'ları oluşturun. Kalıcı/üretim
ihtiyacı doğarsa **E** (en az operasyon) veya **D**'ye (container şartı varsa) geçin.
Dashboard'lar saved object olarak dışa aktarıldığı için taşıma kolaydır (bkz. Adım 6).

---

## 2. Ön hazırlık

- [ ] Azure aboneliği ve yetki (Resource Group oluşturabilecek rol: en az *Contributor*)
- [ ] Azure CLI kurulu ve giriş yapılmış: `az login`, `az account set --subscription <id>`
- [ ] Bölge seçimi (veri yerleşimi ve gecikme açısından size yakın bir Azure bölgesi)
- [ ] Elastic Stack sürümü seçimi: Elasticsearch ve Kibana **aynı sürüm** olmalı.
      Güncel sürümü elastic.co'dan kontrol edin, aşağıda `STACK_VERSION` olarak kullanılır.
- [ ] Lisans: Elastic'in ücretsiz *Basic* lisansı bu kullanım için yeterli
- [ ] Şifreler için Azure Key Vault (veya en azından repoya girmeyen bir `.env`)

---

## 3. Altyapı (Seçenek A — VM)

### 3.1 Kaynaklar

| Kaynak | Öneri | Not |
|---|---|---|
| Resource Group | `rg-dalan-kibana` | Her şey tek grupta; silince hepsi gider |
| VM | Linux (Ubuntu LTS), **en az 8 GB RAM** (16 GB rahat) | 10.000 kayıt için küçük VM yeter; ES heap'i RAM'in yarısı |
| Disk | Ayrı managed data disk (Premium SSD, 32–64 GB) | ES verisi OS diskinde durmasın |
| Ağ | VNet + NSG | **9200 portu internete açılmaz**; 5601 sadece sizin IP'nize |
| Otomatik kapanma | Akşam saatinde | Demo ortamında maliyeti ciddi düşürür |

### 3.2 Taslak komutlar

```bash
RG=rg-dalan-kibana
LOC=<azure-bölgesi>
MY_IP=$(curl -s https://api.ipify.org)

az group create -n $RG -l $LOC

az vm create -g $RG -n vm-kibana \
  --image Ubuntu2204 --size <8-16GB-RAM-boyutu> \
  --admin-username azureuser --generate-ssh-keys \
  --data-disk-sizes-gb 64 --public-ip-sku Standard

# Kibana'ya sadece kendi IP'nizden erişim (SSH zaten açık gelir; onu da kısıtlayın)
az network nsg rule create -g $RG --nsg-name vm-kibanaNSG -n allow-kibana-myip \
  --priority 1010 --source-address-prefixes $MY_IP --destination-port-ranges 5601 \
  --access Allow --protocol Tcp

az vm auto-shutdown -g $RG -n vm-kibana --time 1900
```

### 3.3 VM içinde

```bash
# Docker + compose eklentisi kurulumu (Docker'ın resmi kurulum adımlarıyla)
# Data diski /data altına bağlayın (fstab'a ekleyin)

# Elasticsearch için zorunlu kernel ayarı
echo 'vm.max_map_count=262144' | sudo tee /etc/sysctl.d/99-elasticsearch.conf
sudo sysctl --system
```

`/opt/elk/docker-compose.yml` (taslak — tek node, güvenlik açık, ES sadece localhost'a bağlı):

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:${STACK_VERSION}
    environment:
      - discovery.type=single-node
      - ELASTIC_PASSWORD=${ELASTIC_PASSWORD}
      - xpack.security.enabled=true
      - xpack.security.http.ssl.enabled=false   # sadece localhost/SSH tüneli üzerinden erişilecek
      - ES_JAVA_OPTS=-Xms4g -Xmx4g              # RAM'in ~yarısı
    volumes:
      - /data/elasticsearch:/usr/share/elasticsearch/data
    ports:
      - "127.0.0.1:9200:9200"
    ulimits:
      memlock: { soft: -1, hard: -1 }
    restart: unless-stopped

  kibana:
    image: docker.elastic.co/kibana/kibana:${STACK_VERSION}
    depends_on: [elasticsearch]
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - ELASTICSEARCH_USERNAME=kibana_system
      - ELASTICSEARCH_PASSWORD=${KIBANA_SYSTEM_PASSWORD}
      - I18N_LOCALE=tr-TR   # Kibana'da Türkçe desteği sınırlı olabilir; gerekirse kaldırın
    ports:
      - "5601:5601"
    restart: unless-stopped
```

İlk kurulumda `kibana_system` kullanıcısının şifresi bir kez ayarlanır:

```bash
docker compose up -d elasticsearch
curl -u elastic:$ELASTIC_PASSWORD -X POST localhost:9200/_security/user/kibana_system/_password \
  -H 'Content-Type: application/json' -d "{\"password\":\"$KIBANA_SYSTEM_PASSWORD\"}"
docker compose up -d kibana
```

### 3.4 TLS

- PoC: Kibana'ya da SSH tüneliyle erişip 5601'i hiç açmamak en güvenlisi:
  `ssh -L 5601:localhost:5601 -L 9200:localhost:9200 azureuser@<vm-ip>`
- Paylaşılacaksa: önüne Caddy/Nginx ile Let's Encrypt sertifikası veya Azure Application Gateway koyun.

---

## 4. Veriyi yükleme

Elasticsearch internete açık olmadığı için yükleme SSH tüneli üzerinden yapılır:

```bash
# Yerel makinede
python3 tools/generate_banking_logs.py --format bulk --write-template
ssh -N -L 9200:localhost:9200 azureuser@<vm-ip> &

ES=http://localhost:9200
AUTH="elastic:$ELASTIC_PASSWORD"

curl -u $AUTH -X PUT "$ES/_index_template/dalan-banking-logs" \
  -H 'Content-Type: application/json' \
  --data-binary @tools/output/dalan-banking-logs.template.json

curl -u $AUTH -X POST "$ES/_bulk?refresh=true" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @tools/output/dalan-banking-logs.bulk.ndjson | head -c 200

curl -u $AUTH "$ES/dalan-banking-logs/_count"   # → {"count":10000,...}
```

Notlar:
- Template **veriden önce** yüklenmeli; yoksa `client.geo.location` geo_point olmaz ve harita çalışmaz.
  Hata yapılırsa: index'i silin (`DELETE dalan-banking-logs`), template'i yükleyin, veriyi tekrar gönderin.
- Kayıt sayısı büyürse (yüz binler) bulk dosyasını parçalara bölün (ör. 5.000 satırlık parçalar).
- Alternatif: script'i doğrudan VM'de çalıştırmak (Python 3 Ubuntu'da hazır gelir).

---

## 5. Kibana kurulumu

- [ ] *Stack Management → Data Views*: `dalan-banking-logs*`, zaman alanı `@timestamp`
- [ ] Discover'da kontrol: zaman aralığını **Son 30 gün** yapın (veri bugünden geriye üretilir)
- [ ] Önerilen dashboard panelleri:

| Panel | Görselleştirme | Alanlar |
|---|---|---|
| Ekran bazlı işlem hacmi | Bar | `screen.code` × `event.action: transaction.complete` |
| Başarı / ret / hata oranı | Stacked bar veya donut | `transaction.result`, `log.level` |
| Hata kodları | Tablo | `error.code`, `error.type`, `screen.code` |
| Zaman içinde trafik | Line (saatlik) | `@timestamp`, kırılım `channel` |
| İşlem süresi p50/p95 | Line | `event.duration` (ns → ms için formatter) |
| Kanal dağılımı | Donut | `channel` |
| Müşteri haritası | Maps | `client.geo.location` |
| Parasal hacim | Metric / Line | `sum(amount.value)` |
| Kredi reddi analizi | Bar | `banking.loan.debt_to_income`, `banking.loan.term_months` |

---

## 6. Tekrar üretilebilirlik

- [ ] Dashboard'lar hazır olunca *Stack Management → Saved Objects → Export* ile
      `tools/kibana/dashboards.ndjson` olarak repoya ekleyin.
- [ ] Altyapıyı Bicep veya Terraform ile koda dökün (`infra/` klasörü):
      RG, VNet/NSG, VM, disk, auto-shutdown, Key Vault.
- [ ] Kurulum adımlarını tek bir script'e toplayın (`tools/load_to_elasticsearch.sh`):
      template → bulk → count kontrolü → saved objects import.
- [ ] Opsiyonel: GitHub Actions ile `workflow_dispatch` tetiklemeli "veriyi yeniden üret ve yükle" job'ı.

---

## 7. Operasyon ve maliyet

- **Maliyet:** En büyük kalem VM'in çalışma süresi. Auto-shutdown + kullanılmadığında `az vm deallocate`
  (deallocate'te compute ücreti durur, disk ücreti sürer). Güncel fiyat için Azure Pricing Calculator.
- **Yedek:** Elasticsearch snapshot'larını Azure Blob Storage'a alın (ES'nin Azure snapshot repository desteği).
  Sentetik veri için yedek şart değil; script ile her zaman yeniden üretilebilir.
- **Güncelleme:** `STACK_VERSION` değiştirip `docker compose pull && docker compose up -d`
  (ES ve Kibana aynı sürümde kalmalı; büyük sürüm geçişlerinde Elastic'in upgrade notlarını okuyun).
- **İzleme:** Azure Monitor VM insights (CPU, disk, RAM); ES için `_cluster/health`.

---

## 8. Sonraki aşama: gerçek loglar

Sentetik veriyle dashboard'lar hazırlandıktan sonra aynı alan yapısını gerçek uygulamaya taşıyın:

1. FastAPI backend'de yapılandırılmış (JSON, ECS alan adlarıyla) loglama — `screen.code`,
   `transaction.id`, `customer.id`, `event.outcome` gibi alanlar sentetik veriyle **aynı isimde** olmalı ki
   dashboard'lar değişmeden çalışsın.
2. Logları gönderme: Elastic Agent / Filebeat, ya da OpenTelemetry Collector → Elasticsearch.
3. Index yerine **data stream** + **ILM** (ör. 30 gün sonra sil) ile saklama politikası.
4. Next.js frontend için Elastic APM RUM veya OpenTelemetry ile sayfa/ekran görüntüleme olayları.

---

## Özet sıralama

1. Mimariyi seç (öneri: VM + Docker Compose) — §1
2. Azure kaynaklarını oluştur, ağı kısıtla — §3.1–3.2
3. VM'de Docker, kernel ayarı, ES + Kibana — §3.3
4. SSH tüneliyle template + veriyi yükle — §4
5. Data view ve dashboard'ları kur — §5
6. Dashboard'ları dışa aktar, altyapıyı koda dök — §6
7. Maliyet/yedek ayarları — §7
8. Gerçek uygulama loglarına geçiş — §8
