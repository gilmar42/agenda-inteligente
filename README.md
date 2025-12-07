# Agenda Inteligente – Fase 1 (Descoberta, Arquitetura e UX Foundation)

Este repositório contém a base arquitetural e o esqueleto visual para iniciar a jornada multi-tenant e microservices conforme o PRD da Fase 1.

## Estrutura

- `frontend/` — SPA React (Vite) com Design System básico, Dark/Light Mode e rotas: Landing, Planos, Login, Admin.
- `backend/` — API Node.js (Express) com Health Check, conexão PostgreSQL (TypeORM) e placeholder Redis.
- `ai-service/` — Microserviço Python (Flask) com endpoint stub `/advisor`.
- `infra/` — Docker Compose para desenvolvimento local (Postgres, Redis e serviços).
- `.github/workflows/` — Pipeline CI para build e testes.

## Requisitos de Ambiente

- Node.js 20+
- Python 3.11+
- Docker Desktop
- PowerShell (pwsh)

## Rodando localmente

```pwsh
# 1) Subir stack com Docker
docker compose -f .\infra\docker-compose.yml up -d

# 2) Frontend (dev)
pushd .\frontend; npm install; npm run dev; popd

# 3) Backend (dev)
pushd .\backend; npm install; npm run dev; popd

# 4) AI Service (dev)
pushd .\ai-service; python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt; python app.py; popd
```

## Variáveis de Ambiente

Crie `.env` em cada serviço conforme exemplos (`.env.example`). Inclui chaves para Sentry e conexões.

## Testes

```pwsh
pushd .\frontend; npm test; popd
pushd .\backend; npm test; popd
pushd .\ai-service; pytest; popd
```

## Próximos passos

- Implementar autenticação (OAuth/Google) no backend.
- Integrar S3/CloudFront no pipeline para o frontend.
- Adicionar testes de integração simulando PostgreSQL.
