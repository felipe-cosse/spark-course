SHELL := /bin/bash
.DEFAULT_GOAL := help

FRONTEND_DIR := frontend
COMPOSE ?= docker compose

.PHONY: help install dev dev-backend build test test-content test-e2e test-solutions check docker-build up up-detached down logs health

help: ## Show available project commands
	@awk 'BEGIN {FS = ":.*##"; printf "Spark Path commands:\n\n"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  %-16s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install frontend dependencies from the lockfile
	cd $(FRONTEND_DIR) && npm ci

dev: ## Start the Vite frontend on http://localhost:5173
	cd $(FRONTEND_DIR) && npm run dev

dev-backend: ## Start the local FastAPI/PySpark backend on port 8000
	uvicorn backend.app:app --reload --port 8000

build: ## Type-check and build the production frontend
	cd $(FRONTEND_DIR) && npm run build

test: ## Run frontend unit tests
	cd $(FRONTEND_DIR) && npm test

test-content: ## Validate exercise, solution, source-page, and definition coverage
	python3 -m backend.content_check

test-e2e: ## Run browser course-flow tests
	cd $(FRONTEND_DIR) && npm run test:e2e

test-solutions: ## Build and execute every published graded solution in Spark
	$(COMPOSE) run --build --rm --no-deps course python -m backend.solution_check

check: test-content test build test-e2e ## Run all non-containerized verification

docker-build: ## Build the complete frontend and PySpark image
	$(COMPOSE) build

up: ## Build and run the complete course in the foreground
	$(COMPOSE) up --build

up-detached: ## Build and run the complete course in the background
	$(COMPOSE) up -d --build --wait --wait-timeout 90

down: ## Stop and remove the course containers
	$(COMPOSE) down

logs: ## Follow application and Spark runner logs
	$(COMPOSE) logs --follow

health: ## Check the running backend and Spark version
	curl --fail --silent --show-error --retry 10 --retry-connrefused --retry-delay 1 http://127.0.0.1:8000/api/health
