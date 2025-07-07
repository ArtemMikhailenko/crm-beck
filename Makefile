# NestJS Auth Template Backend Makefile

# Default target
.PHONY: help
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Development commands
.PHONY: install
install: ## Install dependencies
	pnpm install

.PHONY: dev
dev: ## Start development server
	pnpm run start:dev

.PHONY: debug
debug: ## Start debug server
	pnpm run start:debug

.PHONY: build
build: ## Build the application
	pnpm run build

.PHONY: start
start: ## Start production server
	pnpm run start:prod

# Code quality
.PHONY: lint
lint: ## Run linter
	pnpm run lint

.PHONY: format
format: ## Format code
	pnpm run format

.PHONY: check
check: lint ## Run all checks (lint)

# Testing
.PHONY: test
test: ## Run unit tests
	pnpm run test

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	pnpm run test:watch

.PHONY: test-cov
test-cov: ## Run tests with coverage
	pnpm run test:cov

.PHONY: test-e2e
test-e2e: ## Run end-to-end tests
	pnpm run test:e2e

.PHONY: test-debug
test-debug: ## Run tests in debug mode
	pnpm run test:debug

# Database commands
.PHONY: db-generate
db-generate: ## Generate Prisma client
	pnpm exec prisma generate

.PHONY: db-push
db-push: ## Push database schema
	pnpm exec prisma db push

.PHONY: db-migrate
db-migrate: ## Run database migrations
	pnpm exec prisma migrate dev

.PHONY: db-migrate-deploy
db-migrate-deploy: ## Deploy database migrations
	pnpm exec prisma migrate deploy

.PHONY: db-seed
db-seed: ## Seed database
	pnpm exec prisma db seed

.PHONY: db-studio
db-studio: ## Open Prisma Studio
	pnpm exec prisma studio

.PHONY: db-reset
db-reset: ## Reset database
	pnpm exec prisma migrate reset

# Docker commands
.PHONY: docker-up
docker-up: ## Start Docker services
	docker-compose up -d

.PHONY: docker-down
docker-down: ## Stop Docker services
	docker-compose down

.PHONY: docker-logs
docker-logs: ## Show Docker logs
	docker-compose logs -f

.PHONY: docker-restart
docker-restart: ## Restart Docker services
	docker-compose restart

# Setup commands
.PHONY: setup
setup: install docker-up db-generate db-push ## Initial project setup

.PHONY: setup-dev
setup-dev: setup ## Setup development environment
	@echo "Development environment ready!"
	@echo "Run 'make dev' to start the development server"

# Clean commands
.PHONY: clean
clean: ## Clean build artifacts
	rm -rf dist
	rm -rf coverage
	rm -rf node_modules/.cache

.PHONY: clean-all
clean-all: clean docker-down ## Clean everything including Docker volumes
	docker-compose down -v
	rm -rf node_modules