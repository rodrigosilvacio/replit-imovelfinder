# Monitor de Casas Mais Baratas

Sistema de monitoramento de imóveis que busca, compara e destaca as melhores oportunidades de compra e locação em sites imobiliários.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — rodar o servidor API (porta 5000)
- `pnpm --filter @workspace/monitor-casas run dev` — rodar o frontend (porta dinâmica)
- `pnpm run typecheck` — typecheck completo de todos os pacotes
- `pnpm run build` — typecheck + build de todos os pacotes
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks e schemas a partir do OpenAPI spec
- `pnpm --filter @workspace/db run push` — aplicar mudanças de schema no banco (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, TanStack Query, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Scraping: Firecrawl (via Replit External APIs)
- Validação: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (a partir do OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — contrato de API (fonte da verdade)
- `lib/db/src/schema/` — schema do banco Drizzle
  - `fontes.ts` — tabela de fontes/sites monitorados
  - `imoveis.ts` — tabela de imóveis coletados
  - `scraping.ts` — tabela de status de scraping
- `artifacts/api-server/src/routes/` — rotas Express
  - `imoveis.ts` — CRUD + filtros + favorito
  - `fontes.ts` — CRUD de fontes
  - `dashboard.ts` — stats do dashboard
  - `scraping.ts` — trigger e status de scraping
  - `relatorio.ts` — relatório de oportunidades
- `artifacts/api-server/src/lib/firecrawl.ts` — integração Firecrawl
- `artifacts/api-server/src/lib/priceAnalysis.ts` — cálculo de médias por região
- `artifacts/monitor-casas/src/` — frontend React

## Architecture decisions

- Scraping via Firecrawl roda em background (não bloqueia resposta HTTP) — retorna 202 imediatamente e atualiza statusCache em memória
- Campos `numeric` do PostgreSQL chegam como string no JavaScript — usar `parseFloat(String(v))` nos componentes frontend
- Análise de preços (médias por região) recalculada automaticamente após cada scraping
- OpenAPI-first: spec em `lib/api-spec/openapi.yaml` gera tanto os hooks React Query quanto os schemas Zod do servidor

## Product

- Dashboard com estatísticas: total de imóveis, abaixo da média, médias de compra/aluguel, favoritos
- Radar de Imóveis: lista ordenada do menor ao maior preço, filtros avançados, destaque em verde para oportunidades
- Relatório de Oportunidades: ranking algorítmico com pontuação e motivo por imóvel
- Fontes de Dados: CRUD de sites monitorados, trigger de scraping por fonte ou global, status em tempo real

## User preferences

- Interface em português (pt-BR)
- Preços formatados com Intl.NumberFormat pt-BR
- Vibe "cockpit analítico" — denso, preciso, tema dark com verde para oportunidades

## Gotchas

- Campos `numeric` do Drizzle retornam como string — sempre usar `parseFloat(String(v))` ou `toNum()` no frontend
- Firecrawl requer `REPL_IDENTITY` e `REPLIT_CONNECTORS_HOSTNAME` (injetados automaticamente no Replit)
- Após codegen, não ler os arquivos gerados — são grandes e consomem contexto

## Pointers

- Ver skill `pnpm-workspace` para estrutura do workspace, TypeScript e detalhes de pacotes
