# ============================================
# OpenProvena Makefile
# Commandes communes pour le développement
# ============================================

.PHONY: help install dev prod test lint clean backup docs

# Couleurs
GREEN  := \033[0;32m
YELLOW := \033[0;33m
NC     := \033[0m

# === Commandes d'aide ===
help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\n${GREEN}%-20s${NC} %s\n", $$1, $$2}'

# === Installation ===
install: ## Installe les dépendances
	@echo "${YELLOW}Installation des dépendances...${NC}"
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

install-dev: ## Installe les dépendances de développement
	@echo "${YELLOW}Installation des dépendances de dev...${NC}"
	cd backend && pip install -r requirements.txt[dev]
	cd frontend && npm install

# === Développement ===
dev-backend: ## Lance le backend en mode développement
	@echo "${YELLOW}Démarrage du backend...${NC}"
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Lance le frontend en mode développement
	@echo "${YELLOW}Démarrage du frontend...${NC}"
	cd frontend && npm run dev

dev: dev-backend dev-frontend ## Lance les deux en mode développement

# === Docker ===
docker-build: ## Construit les images Docker
	@echo "${YELLOW}Construction des images Docker...${NC}"
	cd docker && docker-compose build

docker-up: ## Démarre les conteneurs Docker
	@echo "${YELLOW}Démarrage des conteneurs...${NC}"
	cd docker && docker-compose up -d

docker-down: ## Arrête les conteneurs Docker
	@echo "${YELLOW}Arrêt des conteneurs...${NC}"
	cd docker && docker-compose down

docker-logs: ## Affiche les logs Docker
	cd docker && docker-compose logs -f

docker-restart: docker-down docker-up ## Redémarre les conteneurs

# === Tests ===
test: ## Lance les tests
	@echo "${YELLOW}Exécution des tests...${NC}"
	cd backend && pytest tests/ -v

test-coverage: ## Lance les tests avec coverage
	@echo "${YELLOW}Exécution des tests avec coverage...${NC}"
	cd backend && pytest tests/ --cov=app --cov-report=html

test-frontend: ## Lance les tests frontend
	@echo "${YELLOW}Exécution des tests frontend...${NC}"
	cd frontend && npm test

# === Linting ===
lint: ## Lance le linting
	@echo "${YELLOW}Linting du code...${NC}"
	cd backend && black --check app/
	cd backend && isort --check-only app/
	cd backend && ruff check app/
	cd frontend && npm run lint

lint-fix: ## Corrige automatiquement les problèmes de linting
	@echo "${YELLOW}Correction automatique...${NC}"
	cd backend && black app/
	cd backend && isort app/
	cd backend && ruff check --fix app/
	cd frontend && npm run lint -- --fix

# === Build ===
build-frontend: ## Build le frontend pour production
	@echo "${YELLOW}Build du frontend...${NC}"
	cd frontend && npm run build

# === Nettoyage ===
clean: ## Supprime les fichiers temporaires
	@echo "${YELLOW}Nettoyage...${NC}"
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true

clean-all: clean ## Supprime tout y compris les images Docker
	@echo "${YELLOW}Nettoyage complet...${NC}"
	cd docker && docker-compose down -v --rmi all
	rm -rf frontend/.next frontend/node_modules
	rm -rf backend/__pycache__ backend/.pytest_cache backend/.ruff_cache

# === Backup ===
backup: ## Effectue un backup
	@echo "${YELLOW}Backup en cours...${NC}"
	./backups/backup.sh daily

backup-weekly: ## Effectue un backup hebdomadaire
	@echo "${YELLOW}Backup hebdomadaire...${NC}"
	./backups/backup.sh weekly

# === Base de données ===
db-migrate: ## Applique les migrations
	@echo "${YELLOW}Application des migrations...${NC}"
	cd backend && alembic upgrade head

db-migrate-create: ## Crée une nouvelle migration
	@echo "${YELLOW}Création de migration...${NC}"
	cd backend && alembic revision --autogenerate -m "$(MESSAGE)"

db-reset: ## Réinitialise la base de données
	@echo "${YELLOW}Réinitialisation de la DB...${NC}"
	cd backend && alembic downgrade base && alembic upgrade head

# === Documentation ===
docs: ## Génère la documentation
	@echo "${YELLOW}Génération de la documentation...${NC}"
	cd backend && pdoc -o ../docs/api app/

# === Statistiques ===
stats: ## Affiche les statistiques du projet
	@echo "${YELLOW}Statistiques du projet${NC}"
	@echo "Frontend:"
	@find frontend/src -name "*.tsx" -o -name "*.ts" | wc -l | xargs echo "  - Fichiers TypeScript:"
	@find frontend/src -name "*.tsx" -o -name "*.ts" | xargs wc -l | tail -1 | awk '{print "  - Lignes de code:", $$1}'
	@echo ""
	@echo "Backend:"
	@find backend/app -name "*.py" | wc -l | xargs echo "  - Fichiers Python:"
	@find backend/app -name "*.py" | xargs wc -l | tail -1 | awk '{print "  - Lignes de code:", $$1}'

# === Production ===
deploy: docker-build docker-up ## Déploie en production

# === Formatage ===
format: ## Formate le code
	@echo "${YELLOW}Formatage du code...${NC}"
	cd backend && black app/
	cd backend && isort app/
	cd frontend && npm run format

# === Mise à jour ===
update-deps: ## Met à jour les dépendances
	@echo "${YELLOW}Mise à jour des dépendances...${NC}"
	cd frontend && npm update
	@echo "${YELLOW}Backend dependencies...${NC}"
	cd backend && pip list --outdated

# === Santé ===
health: ## Vérifie la santé des services
	@echo "${YELLOW}Vérification de santé...${NC}"
	@curl -s http://localhost:8000/health || echo "Backend: KO"
	@curl -s http://localhost:3000 | grep -q "DOCTYPE" && echo "Frontend: OK" || echo "Frontend: KO"
