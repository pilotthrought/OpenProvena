#!/bin/sh
# OpenProvena — script de déploiement
# node_modules est embarqué dans le zip — aucun accès réseau npm requis

set -e

echo "==> Arrêt des containers existants..."
docker compose down

echo "==> Rebuild du frontend (pas de npm install réseau)..."
docker compose build --no-cache frontend

echo "==> Rebuild de l'API..."
docker compose build --no-cache api

echo "==> Démarrage de tous les services..."
docker compose up -d

echo "==> Attente de l'API (max 90s)..."
for i in $(seq 1 18); do
  if docker compose exec api curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓ API prête."
    break
  fi
  printf "  Attente... (%ds)\n" "$((i*5))"
  sleep 5
done

echo ""
echo "✓ OpenProvena démarré"
echo "  Frontend  : http://localhost:3000"
echo "  API       : http://localhost:8000"
echo "  Docs API  : http://localhost:8000/docs"
echo "  Grafana   : http://localhost:3001"
echo "  RabbitMQ  : http://localhost:15672"
