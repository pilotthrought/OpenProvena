# Guide d'installation OpenProvena sur Debian 12

## Prérequis

- Un serveur Debian 12 fraîchement installé
- Accès root ou sudo
- Un nom de domaine (recommandé)
- 4GB RAM minimum, 8GB recommandé
- 20GB d'espace disque disponible

## Étape 1 : Préparation du serveur

### Mise à jour du système

```bash
sudo apt update && sudo apt upgrade -y
```

### Installation des dépendances de base

```bash
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw \
    fail2ban
```

## Étape 2 : Installation de Docker

### Ajout de la clé GPG de Docker

```bash
# Télécharger la clé GPG
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

### Ajout du dépôt Docker

```bash
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list
```

### Installation de Docker Engine

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### Vérification de l'installation

```bash
docker --version
docker compose version
```

## Étape 3 : Configuration de Docker

### Ajouter l'utilisateur au groupe docker

```bash
sudo usermod -aG docker $USER
# reconnectez-vous ou exécutez :
newgrp docker
```

### Configuration du daemon Docker

```bash
sudo nano /etc/docker/daemon.json
```

Ajoutez le contenu suivant :

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
```

Redémarrez Docker :

```bash
sudo systemctl restart docker
sudo systemctl enable docker
```

## Étape 4 : Installation d'OpenProvena

### Cloner le dépôt

```bash
cd ~
git clone https://github.com/pilotthrought/Openprovena.git
cd Openprovena
```

### Configuration de l'environnement

```bash
cp .env.example .env
nano .env
```

Modifiez les variables essentielles :

```env
# Sécurité - CHANGEZ CES VALEURS!
SECRET_KEY=votre-cle-secrete-tres-longue-et-unique
DEBUG=false

# URLs
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/openprovena
REDIS_URL=redis://redis:6379/0

# CORS - Ajoutez votre domaine
CORS_ORIGINS=http://localhost:3000,https://openprovena.org
```

## Étape 5 : Démarrage des services

```bash
cd docker

# Construire et lancer tous les services
docker-compose up -d --build

# Vérifier le statut
docker-compose ps
```

Tous les services devraient être "Up" :

```
NAME                    STATUS
openprovena-backend     Up
openprovena-celery     Up
openprovena-elasticsearch   Up
openprovena-frontend   Up
openprovena-grafana    Up
openprovena-neo4j      Up
openprovena-nginx      Up
openprovena-postgres    Up
openprovena-prometheus  Up
openprovena-redis      Up
```

## Étape 6 : Accès aux services

| Service | URL | Identifiants |
|---------|-----|--------------|
| Site web | http://localhost:3000 | - |
| API | http://localhost:8000/docs | - |
| Grafana | http://localhost:3030 | admin/admin |
| Neo4j | http://localhost:7474 | neo4j/password |
| Prometheus | http://localhost:9090 | - |

## Étape 7 : Configuration du pare-feu

```bash
# Configurer ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Frontend (dev seulement)
sudo ufw enable
sudo ufw status
```

## Étape 8 : SSL avec Let's Encrypt (Production)

### Installation de Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtention du certificat

```bash
# Arrêter nginx temporairement
docker-compose stop nginx

# Obtenir le certificat
sudo certbot certonly --standalone -d openprovena.org -d www.openprovena.org

# Démarrer nginx
docker-compose start nginx
```

### Configuration des certificats dans Nginx

Créez le répertoire SSL :

```bash
sudo mkdir -p /opt/openprovena/docker/ssl
sudo cp /etc/letsencrypt/live/openprovena.org/fullchain.pem /opt/openprovena/docker/ssl/cert.pem
sudo cp /etc/letsencrypt/live/openprovena.org/privkey.pem /opt/openprovena/docker/ssl/key.pem
sudo chmod 600 /opt/openprovena/docker/ssl/*
```

Modifiez `docker/nginx.conf` pour utiliser les certificats.

### Renouvellement automatique

```bash
# Test du renouvellement
sudo certbot renew --dry-run

# Ajouter au cron
sudo crontab -e
# Ajoutez cette ligne :
0 0 * * * certbot renew --quiet --deploy-hook "docker-compose -f /home/user/Openprovena/docker/docker-compose.yml restart nginx"
```

## Étape 9 : Sauvegardes automatiques

### Configuration des sauvegardes

```bash
# Rendre le script exécutable
chmod +x backups/backup.sh

# Ajouter au cron (quotidien à 3h du matin)
crontab -e
# Ajoutez :
0 3 * * * /home/user/Openprovena/backups/backup.sh daily >> /var/log/openprovena-backup.log 2>&1
```

### Vérification des sauvegardes

```bash
ls -la backups/daily/
```

## Étape 10 : Monitoring et maintenance

### Logs

```bash
# Voir tous les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend

# Logs avec limite de temps
docker-compose logs --tail=100 backend
```

### Mise à jour

```bash
git pull origin main
docker-compose pull
docker-compose up -d --build
docker-compose ps
```

### Vérification de la santé

```bash
# API
curl http://localhost:8000/health

# Frontend
curl -I http://localhost:3000
```

## Dépannage

### Le site ne charge pas

```bash
# Vérifier les logs
docker-compose logs nginx

# Redémarrer nginx
docker-compose restart nginx
```

### Erreur de base de données

```bash
# Vérifier PostgreSQL
docker-compose logs postgres

# Se connecter à PostgreSQL
docker-compose exec postgres psql -U postgres -d openprovena
```

### Ports déjà utilisés

```bash
# Vérifier quel processus utilise le port
sudo lsof -i :3000
sudo lsof -i :8000

# Tuer le processus si nécessaire
sudo kill -9 <PID>
```

## Désinstallation

```bash
# Arrêter tous les services
docker-compose down

# Supprimer les volumes (ATTENTION : supprime les données)
docker-compose down -v

# Supprimer les images
docker-compose down --rmi all

# Revenir au répertoire parent et supprimer
cd ..
rm -rf Openprovena
```

## Support

- **GitHub Issues** : https://github.com/pilotthrought/Openprovena/issues
- **Reddit** : https://www.reddit.com/r/OpenProvena/
- **LinkedIn** : https://www.linkedin.com/company/openprovena/
