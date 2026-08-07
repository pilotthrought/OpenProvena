# Documentation OpenProvena

## Table des matières

1. [À propos](#à-propos)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Développement](#développement)
6. [Déploiement](#déploiement)
7. [API](#api)
8. [Sécurité](#sécurité)

---

## À propos

### Le problème

Aujourd'hui, on peut facilement vérifier si une connexion Internet est sécurisée. Mais, lorsqu'on lit un article, une réponse générée par une IA ou une publication sur un réseau social, il est souvent très difficile de savoir rapidement :
- d'où vient l'information
- quelles preuves la soutiennent
- si elle a été modifiée
- pourquoi on devrait lui faire confiance

On dispose d'outils pour sécuriser les communications. Beaucoup moins pour évaluer la confiance des informations elles-mêmes.

### La solution : OpenProvena

L'idée est de construire un standard ouvert qui permette d'associer à une information :
- sa **provenance**
- les **preuves** qui l'accompagnent
- différents **indicateurs de confiance**

L'objectif n'est pas de décider de ce qui est vrai ou faux. L'objectif est de donner à chacun les éléments nécessaires pour se faire son propre jugement.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    UTILISATEURS                      │
└─────────────────────────────────────────────────────┘
                        │
        ┌─────────────────┴─────────────────┐
        │                               │
┌───────┴───────┐           ┌─────────┴─────────┐
│  Web App      │           │  Public API      │
│  Next.js      │           │  REST/GraphQL    │
└───────────────┘           └─────────────────┘
        │                               │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │      API GATEWAY            │
        │ Authentication / Rate Limit  │
        └───────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Trust Scoring │ │ Search Engine │ │ Graph Explorer│
│ Engine       │ │               │ │              │
└───────────────┘ └───────────────┘ └───────────────┘
```

### Stack technique

| Composant | Technologie |
|-----------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Python 3.12, FastAPI, Pydantic |
| Base de données | PostgreSQL 16, Neo4j, Redis, Elasticsearch |
| IA/ML | PyTorch, Transformers, spaCy |
| Infrastructure | Docker, Docker Compose |

---

## Installation

### Prérequis

- Docker et Docker Compose v2+
- Git
- 4GB RAM minimum (8GB recommandé)
- 20GB d'espace disque

### Installation rapide

```bash
# 1. Cloner le dépôt
git clone https://github.com/pilotthrought/Openprovena.git
cd Openprovena

# 2. Configurer l'environnement
cp .env.example .env
nano .env  # Modifier les valeurs si nécessaire

# 3. Lancer les services
cd docker
docker-compose up -d

# 4. Vérifier le statut
docker-compose ps
```

### Installation sur Debian 12

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Docker
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Ajouter la clé GPG de Docker
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Ajouter le dépôt Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker

# Installer Git
sudo apt install -y git

# Cloner et lancer
git clone https://github.com/pilotthrought/Openprovena.git
cd Openprovena
```

---

## Configuration

### Variables d'environnement

```bash
# .env

# Application
APP_NAME=OpenProvena
DEBUG=false
SECRET_KEY=votre-cle-secrete-tres-longue

# URLs
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/openprovena
REDIS_URL=redis://redis:6379/0

# CORS (domaines autorisés)
CORS_ORIGINS=http://localhost:3000,https://openprovena.org

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
```

### Ports par défaut

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend API | 8000 |
| PostgreSQL | 5432 |
| Neo4j | 7474 |
| Redis | 6379 |
| Elasticsearch | 9200 |
| Nginx | 80/443 |
| Prometheus | 9090 |
| Grafana | 3030 |

---

## Développement

### Démarrage rapide

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev
```

### Commandes utiles

```bash
# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Redémarrer un service
docker-compose restart backend

# Accéder à un conteneur
docker-compose exec backend bash

# Mettre à jour les images
docker-compose pull
docker-compose up -d
```

---

## Déploiement

### Préparation pour la production

1. **Configurer le domaine**
   ```bash
   # Pointer le DNS vers votre serveur
   # openprovena.org -> IP_du_serveur
   ```

2. **Obtenir un certificat SSL**
   ```bash
   # Avec Let's Encrypt
   sudo apt install certbot
   sudo certbot certonly --nginx -d openprovena.org -d www.openprovena.org
   ```

3. **Configurer Nginx**
   - Copier les certificats dans `docker/ssl/`
   - Modifier `docker/nginx.conf` avec les chemins corrects

4. **Sécurité**
   - Modifier `SECRET_KEY` dans `.env`
   - Configurer le pare-feu (ufw)
   - Activer les logs de monitoring

### Script de déploiement complet

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Déploiement d'OpenProvena..."

# Pull последняя версия
git pull origin main

# Build les images
docker-compose build

# Arrêt des services
docker-compose down

# Démarrage des services
docker-compose up -d

# Vérification
sleep 10
curl -f http://localhost:3000 || exit 1

echo "Déploiement terminé avec succès!"
```

---

## API

### Endpoints principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/health` | Santé du service |
| GET | `/api/v1/analyze` | Analyser une URL |
| GET | `/api/v1/search` | Rechercher des sources |
| GET | `/api/v1/dashboard/stats` | Statistiques |
| GET | `/api/v1/narratives/trending` | Narratifs tendances |
| GET | `/api/v1/graph/{domain}` | Graphe de relations |

### Exemple d'utilisation

```bash
# Analyser une URL
curl "http://localhost:8000/api/v1/analyze?url=https://exemple.com"

# Réponse
{
  "id": "abc123",
  "domain": "exemple.com",
  "score": 78,
  "trust_level": "high",
  "signals": [...],
  "explanation": "..."
}
```

### Documentation API

Accédez à la documentation interactive : `http://localhost:8000/docs`

---

## Sécurité

### Headers de sécurité

Le site inclut les headers de sécurité suivants :
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy`
- `Permissions-Policy`

### Bonnes pratiques

1. **Mises à jour régulières**
   ```bash
   # Vérifier les mises à jour de sécurité
   docker-compose pull
   docker-compose up -d
   ```

2. **Sauvegardes**
   ```bash
   # Sauvegarde automatique
   ./backups/backup.sh daily
   ```

3. **Monitoring**
   - Prometheus : http://localhost:9090
   - Grafana : http://localhost:3030

4. **Pare-feu**
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

---

## Support

- **GitHub Issues** : https://github.com/pilotthrought/Openprovena/issues
- **Reddit** : https://www.reddit.com/r/OpenProvena/
- **LinkedIn** : https://www.linkedin.com/company/openprovena/

---

## Licence

MIT License - Voir [LICENSE](LICENSE)
