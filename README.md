# Monitor Casas

Sistema de monitoramento de imóveis com scraping automatizado e análise de preços. Coleta dados de sites imobiliários, identifica oportunidades abaixo da média de mercado e oferece uma interface moderna para visualização e gestão.

## Funcionalidades Principais

- **Scraping de imóveis**: Coleta automatizada de dados de sites imobiliários usando Firecrawl
- **Análise de preços**: Identificação de imóveis abaixo da média de mercado por região
- **Dashboard**: Visão geral com estatísticas, distribuição por cidades e oportunidades em destaque
- **Gestão de fontes**: Cadastro e gerenciamento de sites para scraping
- **Sistema de favoritos**: Marcação de imóveis de interesse
- **Relatórios**: Geração de relatórios com as melhores oportunidades pontuadas
- **Filtros avançados**: Busca por tipo (compra/aluguel), cidade, bairro, faixa de preço, quantidade de quartos

## Stack Tecnológica

- **Monorepo**: pnpm workspaces
- **Backend**: Node.js, Express 5, TypeScript
- **Frontend**: React 19, Vite, TailwindCSS, Radix UI, React Query
- **Banco de dados**: PostgreSQL com Drizzle ORM
- **Validação**: Zod para schemas de API
- **Geração de código**: Orval para clientes de API tipados
- **Scraping**: Firecrawl (via Replit Connectors)
- **Logging**: Pino

## Estrutura de Pastas

```
/
├── artifacts/
│   ├── api-server/        # Servidor da API REST
│   ├── monitor-casas/     # Aplicação frontend React
│   └── mockup-sandbox/    # Ambiente de desenvolvimento de mockups
├── lib/
│   ├── api-client-react/  # Cliente React Query gerado para a API
│   ├── api-spec/          # Configuração do Orval para geração de código
│   ├── api-zod/           # Schemas Zod gerados para validação
│   └── db/                # Schema do banco de dados (Drizzle ORM)
└── scripts/               # Scripts utilitários
```

## Instalação

```bash
# Instalar dependências (requer pnpm)
pnpm install
```

## Configuração

### Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão PostgreSQL |
| `PORT` | Porta do servidor da API |
| `REPL_IDENTITY` | Identidade Replit (para Firecrawl) |
| `REPLIT_CONNECTORS_HOSTNAME` | Hostname do conector Replit (para Firecrawl) |

### Banco de Dados

```bash
# Aplicar schema no banco de dados
pnpm --filter @workspace/db push
```

## Execução

### Desenvolvimento

```bash
# Backend (API)
pnpm --filter @workspace/api-server dev

# Frontend
pnpm --filter @workspace/monitor-casas dev
```

### Build

```bash
# Build de todos os pacotes
pnpm build
```

### Produção

```bash
# Iniciar o servidor da API
pnpm --filter @workspace/api-server start

# Servir o frontend buildado
pnpm --filter @workspace/monitor-casas serve
```

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/dashboard` | Estatísticas e oportunidades em destaque |
| `GET` | `/api/imoveis` | Listagem de imóveis com filtros e paginação |
| `GET` | `/api/imoveis/:id` | Detalhes de um imóvel |
| `PATCH` | `/api/imoveis/:id/favorito` | Marcar/desmarcar como favorito |
| `GET` | `/api/fontes` | Listar fontes de scraping |
| `POST` | `/api/fontes` | Criar nova fonte |
| `PATCH` | `/api/fontes/:id` | Atualizar fonte |
| `DELETE` | `/api/fontes/:id` | Remover fonte |
| `GET` | `/api/scraping/status` | Status do scraping atual |
| `POST` | `/api/scraping/iniciar` | Iniciar processo de scraping |
| `GET` | `/api/relatorio` | Gerar relatório de oportunidades |

## Licença

MIT
