# OpenProvena

**Un standard ouvert pour évaluer la crédibilité de l'information.**

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend Next.js 14   →  http://localhost:3000         │
│  (TypeScript · Tailwind · Recharts)                     │
└────────────────────┬────────────────────────────────────┘
                     │ API calls via rewrites
┌────────────────────▼────────────────────────────────────┐
│  FastAPI Backend       →  http://localhost:8000         │
│  /v1/trust · /v1/search · /v1/narratives · /v1/auth    │
└──────┬──────────────────────────────────────────────────┘
       │ asyncio.gather — 10 agents en parallèle
┌──────▼──────────────────────────────────────────────────┐
│  Signal Agents (10)                                     │
│  domain_age · ownership · citation_quality              │
│  factcheck · editorial · ai_detection                   │
│  bot_amplification · narrative · security · historical  │
└──────┬──────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────┐
│  PostgreSQL · Redis · Elasticsearch · Neo4j             │
│  RabbitMQ · Celery · Prometheus · Grafana               │
└─────────────────────────────────────────────────────────┘
```

---

## Quickstart

```bash
# 1. Cloner et configurer
git clone https://github.com/your-org/openprovena
cd openprovena
cp .env.example .env
# Générer un SECRET_KEY :
# openssl rand -hex 32

# 2. Démarrer tous les services (~3 min au premier lancement)
docker compose up -d

# 3. Vérifier
curl http://localhost:8000/health
# {"status":"ok","version":"0.9.0"}

# 4. Frontend
open http://localhost:3000

# 5. API interactive
open http://localhost:8000/docs
```

---

## Services

| Service           | URL                        |
|-------------------|----------------------------|
| **Frontend**      | http://localhost:3000      |
| **API / Swagger** | http://localhost:8000/docs |
| **RabbitMQ UI**   | http://localhost:15672     |
| **Neo4j Browser** | http://localhost:7474      |
| **Flower**        | http://localhost:5555      |
| **Grafana**       | http://localhost:3001      |
| **Prometheus**    | http://localhost:9090      |

---

## Signal agents

| Agent                    | Sources réelles                        | Fallback          |
|--------------------------|----------------------------------------|-------------------|
| `domain_age`             | RDAP (rdap.org), WHOIS API             | Heuristique seed  |
| `ownership_transparency` | RDAP registrant, probe pages légales   | Index curé        |
| `citation_quality`       | Scraping homepage + NLP regex          | Score neutre      |
| `factcheck_overlap`      | ClaimBuster, EUvsDisinfo, IFCN         | Index curé        |
| `editorial_quality`      | Probe charte/corrections/masthead      | Index curé        |
| `ai_content_detection`   | Analyse stylométrique (CV, TTR, etc.)  | Index curé        |
| `bot_amplification`      | RSS régularité, Social meta tags       | Index curé        |
| `narrative_propagation`  | Framing NLP, CommonCrawl index         | Index curé        |
| `security_risk`          | Google Safe Browsing, VirusTotal, SSL  | Index curé        |
| `historical_reliability` | Wayback Machine, index éditorial       | Index curé        |

---

## Clés API optionnelles (`.env`)

```bash
GOOGLE_SAFEBROWSING_KEY=   # agent security (gratuit Google Cloud)
VIRUSTOTAL_API_KEY=         # agent security (tier gratuit disponible)
CLAIMBUSTER_API_KEY=        # agent factcheck (idir.uta.edu)
```

Sans ces clés, chaque agent utilise son index curé ou son fallback heuristique.
