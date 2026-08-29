# OpenProvena

**Un standard ouvert pour évaluer la crédibilité de l'information.**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.12-blue)
![Next.js](https://img.shields.io/badge/next.js-14-black)

---

## 📋 Table des matières

- [À propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Démarrage rapide](#-démarrage-rapide)
- [Documentation](#-documentation)
- [Contribution](#-contribution)
- [License](#-license)

---

## 🎯 À propos

OpenProvena est une plateforme open source d'analyse de la crédibilité de l'information. Elle permet de :

- **Analyser la confiance** d'une URL ou d'un domaine en quelques secondes
- **Détecter les contenus générés par IA** avec une précision élevée
- **Suivre les narratifs** et leur propagation sur le web
- **Explorer les relations** entre sources, auteurs et organisations

### Pourquoi OpenProvena ?

- ✅ **100% Open Source** - Code transparent et auditable
- ✅ **Multi-langue** - Français et Anglais supportés
- ✅ **API REST/GraphQL** - Intégration facile
- ✅ **Scalable** - Architecture microservices prête pour Kubernetes
- ✅ **Communautaire**

---

## ✨ Fonctionnalités

### 🔍 Trust Analysis
Analyse approfondie de plus de 50 signaux de confiance :
- Âge du domaine et historique
- Configuration SSL/TLS
- Transparence de la propriété
- Qualité des citations
- Recoupement avec les fact-checks
- Détection de contenu IA

### 📊 Narrative Tracker
- Détection des narratifs émergents
- Analyse de la propagation
- Cartographie géographique
- Suivi des sources de désinformation

### 🕸️ Knowledge Graph
- Exploration visuelle des relations
- Liens entre domaines, auteurs, organisations
- Clustering automatique
- Analyse des réseaux d'influence

### 🛡️ Sécurité
- Headers de sécurité modernes
- Rate limiting
- Authentification JWT
- Audit trail complet

---

## 🏗️ Architecture

```
OPEN TRUST INFRASTRUCTURE
=============================================================
                 ┌────────────────────┐
                 │    UTILISATEURS    │
                 └──────────┬─────────┘
                 ┌────────────────────┐
                 ▼                    ▼
         ┌────────────────┐   ┌────────────────┐
         │  Web App       │   │ Public API     │
         │ Dashboard UI   │   │ REST/GraphQL   │
         └───────┬────────┘   └───────┬────────┘
                 │                    │
                 └────────────────────┘
                           │
                           ▼
               ┌─────────────────────────┐
               │     API GATEWAY         │
               │ Authentication / RBAC   │
               │ Rate Limiting / Billing │
               └───────────┬─────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Search Service │ │ Trust Scoring  │ │ Graph Explorer │
│ URL Lookup     │ │ Engine         │ │ Relationships  │
└──────┬─────────┘ └───────┬────────┘ └───────┬────────┘
       │                   │                  │
       └───────────────────┼──────────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │   TRUST ORCHESTRATOR     │
              │ Workflow / Pipelines     │
              │ Agent Coordination       │
              └────────────┬─────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
  │ Source Agent  │ │ Content Agent │ │ Claims Agent  │
  │ Domain Trust  │ │ NLP Extraction│ │ Fact Signals  │
  └──────┬────────┘ └──────┬────────┘ └──────┬────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                           ▼
    ┌─────────────────────────────────────────────┐
    │               SIGNAL LAYER                  │
    ├─────────────────────────────────────────────┤
    │ Domain Age                                  │
    │ Ownership Transparency                      │
    │ Citation Quality                            │
    │ Fact-check Overlap                          │
    │ Editorial Quality                           │
    │ AI-generated Content Detection              │
    │ Bot / Amplification Detection               │
    │ Narrative Propagation                       │
    │ Malware / Security Risk                     │
    │ Historical Reliability                      │
    └─────────────────────┬───────────────────────┘
                          │
                          ▼
             ┌──────────────────────────┐
             │     SCORING ENGINE       │
             │ Probabilistic Models     │
             │ Weighted Rules           │
             │ Confidence Estimation    │
             │ Explainability Layer     │
             └────────────┬─────────────┘
                          │
                          ▼
        ┌───────────────────────────┐
        │   KNOWLEDGE GRAPH LAYER   │
        │ Domains                   │
        │ Authors                   │
        │ Organizations             │
        │ Claims                    │
        │ Narratives                │
        │ Fact-checks               │
        │ Social Clusters           │
        └──────────┬────────────────┘
                   │
                   ▼
       ┌────────────────────────────┐
       │      DATA STORAGE          │
       ├────────────────────────────┤
       │ PostgreSQL                 │
       │ Neo4j / Memgraph           │
       │ Elasticsearch/OpenSearch   │
       │ ClickHouse                 │
       │ Object Storage (S3)        │
       └──────────┬─────────────────┘
                  │
                  ▼
      ┌──────────────────────────────┐
      │      INGESTION LAYER         │
      ├──────────────────────────────┤
      │ Web Crawlers                 │
      │ RSS Collectors               │
      │ Social Stream Ingestion      │
      │ YouTube / Podcast Parsing    │
      │ User Reports                 │
      │ Fact-check Databases         │
      └──────────┬───────────────────┘
                 │
                 ▼
      ┌──────────────────────────────┐
      │      INFRASTRUCTURE          │
      ├──────────────────────────────┤
      │ Kubernetes                   │
      │ Docker                       │
      │ Kafka / RabbitMQ             │
      │ Ray / Celery                 │
      │ Redis Cache                  │
      │ CDN                          │
      │ Monitoring / Observability   │
      └──────────────────────────────┘
```

### Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind |
| Backend | Python 3.12, FastAPI, Pydantic |
| Database | PostgreSQL 16, Neo4j, Redis, Elasticsearch |
| AI/ML | PyTorch, Transformers, spaCy |
| Infrastructure | Docker, Kubernetes, Celery |

---

## 🚀 Démarrage rapide

### Prérequis

- Docker et Docker Compose
- Git
- 8GB RAM minimum (16GB recommandé)

### Installation

1. **Clonez le dépôt**

```bash
git clone https://github.com/openprovena/openprovena.git
cd openprovena
```

2. **Configurez l'environnement**

```bash
cp .env.example .env
# Éditez .env avec vos valeurs
```

3. **Lancez avec Docker Compose**

```bash
cd docker
docker-compose up -d
```

4. **Accédez à l'application**

- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Grafana: http://localhost:3030

### Développement local

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📚 Documentation

- [Documentation complète](./docs/)
- [API Reference](./docs/api/)
- [Guide d'installation](./docs/installation.md)
- [Architecture technique](./docs/architecture.md)
- [Guide de contribution](./CONTRIBUTING.md)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez lire notre guide de contribution avant de soumettre une pull request.

### Processus

1. Forkez le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 🔒 Sécurité

Pour signaler une vulnérabilité, veuillez envoyer un email à security@openprovena.org

---

## 💾 Backup

Des scripts de backup sont fournis dans `backups/backup.sh` :

```bash
# Backup quotidien
./backups/backup.sh daily

# Backup hebdomadaire
./backups/backup.sh weekly

# Backup mensuel
./backups/backup.sh monthly
```

---

## 📝 License

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<p align="center">
  <strong>OpenProvena</strong> - Un standard ouvert pour évaluer la crédibilité de l'information.
</p>
