# OpenProvena — Guide de mise en production

Ce document couvre le déploiement durci, à utiliser en plus du `README.md` (qui couvre le dev local).

---

## 1. Prérequis serveur

- Linux x86_64, 4 vCPU / 8 Go RAM minimum (la stack complète avec ES + Neo4j est lourde)
- Docker Engine 24+ et Docker Compose v2
- Un nom de domaine avec accès DNS (ex: `openprovena.org`)
- Ports 80 et 443 ouverts publiquement (rien d'autre — voir section réseau)
- `openssl` et idéalement `htpasswd` (paquet `apache2-utils` / `httpd-tools`)

## 2. Différences avec le `docker-compose.yml` de développement

| | Dev (`docker-compose.yml`) | Prod (`docker-compose.prod.yml`) |
|---|---|---|
| Ports DB exposés à l'hôte | Oui (5432, 6379, 7687...) | **Non** — réseau Docker interne uniquement |
| Mots de passe | En dur (`provena:provena`) | Fichiers secrets générés (`openssl rand -hex 32`) |
| TLS | Aucun | Automatique via Traefik + Let's Encrypt |
| `/docs`, `/redoc` | Activés | **Désactivés** (`ENVIRONMENT=production`) |
| CORS | `*` autorisé en pratique | Domaines exacts uniquement |
| Restart policy | `unless-stopped` | `always` |
| Limites ressources | Aucune | CPU/RAM plafonnés par service |
| Logs | Illimités | Rotation JSON (10 Mo × 3 fichiers) |

**Ne réutilisez jamais `docker-compose.yml` tel quel en production** — il expose les bases de données directement sur l'hôte.

## 3. Étapes de déploiement

```bash
# 1. Cloner le projet sur le serveur
git clone <repo> openprovena && cd openprovena

# 2. Configurer le domaine
cp .env.production.example .env.production
nano .env.production   # DOMAIN=votredomaine.com, ACME_EMAIL=vous@domaine.com

# 3. Générer tous les secrets (mots de passe DB, JWT key...)
chmod +x scripts/*.sh
./scripts/generate-secrets.sh

# 4. Vérifier le DNS — ces 4 sous-domaines doivent pointer vers l'IP du serveur :
#      votredomaine.com
#      api.votredomaine.com
#      grafana.votredomaine.com
#      flower.votredomaine.com
dig +short votredomaine.com
dig +short api.votredomaine.com

# 5. Déployer (vérifications pré-vol automatiques incluses)
./scripts/deploy-production.sh
```

Le script vérifie avant de lancer quoi que ce soit :
- présence et non-vacuité des secrets
- permissions correctes (600) sur les fichiers secrets
- `DOMAIN` non laissé à sa valeur d'exemple
- espace disque disponible
- confirmation manuelle que le DNS est propagé

## 4. Ce qui bloque le démarrage si mal configuré

`app/core/config.py` contient un `model_validator` qui **refuse de démarrer** (`SystemExit(1)`) si `ENVIRONMENT=production` et que l'une de ces conditions est vraie :

- `SECRET_KEY` absent, vide, ou identique à la valeur de dev
- `ALLOWED_HOSTS` contient `"*"`
- `CORS_ORIGINS` contient `localhost` ou `"*"`
- `POSTGRES_URL` utilise un mot de passe de la liste noire (`provena`, `password`, etc.)
- `NEO4J_PASSWORD` idem

C'est volontaire : mieux vaut un crash explicite au démarrage qu'un déploiement silencieusement vulnérable. Le message d'erreur liste précisément quoi corriger.

## 5. Réseau et exposition

```
Internet (80/443)
      │
      ▼
  ┌────────┐
  │Traefik │  ← seul point d'entrée, TLS terminé ici
  └───┬────┘
      │  réseau "edge" (Docker bridge)
      ├──→ frontend (Next.js)
      ├──→ api (FastAPI)
      ├──→ grafana
      └──→ flower (+ basic auth)
              │  réseau "internal" (Docker bridge, internal: true → pas de sortie internet, pas d'accès depuis l'hôte)
              ├──→ postgres
              ├──→ redis
              ├──→ rabbitmq
              ├──→ elasticsearch
              └──→ neo4j
```

Aucune base de données n'a de port mappé vers l'hôte (`ports:` absent) — elles ne sont joignables que depuis les autres containers du réseau `internal`. Si vous devez vous y connecter manuellement (debug), passez par :

```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U provena openprovena
```

## 6. Backups

```bash
# Backup manuel
./scripts/backup.sh

# Backup automatique (cron, tous les jours à 3h)
crontab -e
# ajouter :
0 3 * * * /chemin/vers/openprovena/scripts/backup.sh >> /var/log/openprovena-backup.log 2>&1
```

Le script dump PostgreSQL + Neo4j, chiffre une archive des secrets avec GPG, et purge les backups de plus de 30 jours. **Synchronisez `./backups/` vers un stockage hors-site** (S3, Backblaze B2, rsync vers un autre serveur) — un backup qui reste sur la même machine que la prod ne protège pas contre la perte du serveur.

## 7. Monitoring

- **Grafana** (`https://grafana.DOMAIN`) — dashboards Prometheus, mot de passe dans `secrets/grafana_password.txt`
- **Flower** (`https://flower.DOMAIN`) — monitoring Celery, protégé par basic auth (généré par `generate-secrets.sh`)
- Logs centralisés : `docker compose -f docker-compose.prod.yml logs -f [service]`

Pensez à brancher Sentry pour le tracking d'erreurs (`SENTRY_DSN` dans `.env.production`, non implémenté côté code — à ajouter dans `main.py` si besoin).

## 8. Mise à jour / redéploiement

```bash
git pull
./scripts/deploy-production.sh
```

Le script rebuild les images sans cache et attend que `/health` soit `healthy` avant de considérer le déploiement terminé. **Il n'y a pas de rollback automatique** — pour un vrai zero-downtime avec rollback, envisagez d'ajouter un orchestrateur (Docker Swarm, Kubernetes) en V2.

## 9. Rotation des secrets

```bash
# Régénérer un secret spécifique
rm secrets/secret_key.txt
./scripts/generate-secrets.sh

# ⚠ Régénérer secret_key.txt invalide TOUS les tokens JWT en circulation
# → tous les utilisateurs devront se reconnecter
```

## 10. Checklist avant d'annoncer le lancement

- [ ] `./scripts/deploy-production.sh` exécuté sans erreur
- [ ] `https://DOMAIN` charge et le bouton de langue FR/EN fonctionne
- [ ] `https://api.DOMAIN/health` retourne `{"status":"ok"}`
- [ ] `https://api.DOMAIN/docs` retourne **404** (confirmant que la doc est bien désactivée en prod)
- [ ] Certificat TLS valide (cadenas vert, pas d'avertissement navigateur)
- [ ] `docker compose -f docker-compose.prod.yml ps` — tous les services `healthy` ou `running`
- [ ] Backup testé manuellement (`./scripts/backup.sh`) et fichier généré dans `./backups/`
- [ ] Cron de backup configuré
- [ ] `secrets/` confirmé absent de `git status` et de l'historique git
- [ ] Grafana accessible et dashboard de base visible
- [ ] Test de charge léger (ex: `ab -n 100 -c 10 https://api.DOMAIN/v1/trust?domain=lemonde.fr`) pour vérifier que le rate limiting répond correctement
