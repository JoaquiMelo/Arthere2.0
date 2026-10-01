# Arthere 2.0 — Backend

API NestJS + Prisma 7 + MySQL/MariaDB.

## Configuração

Crie backend/.env a partir de .env.example. Nunca envie .env para o GitHub.

## Banco existente

Esta versão é aditiva e não usa prisma migrate reset.

Se o banco já possui as tabelas iniciais, mas não possui _prisma_migrations, registre a migração inicial e depois aplique somente as complementares:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:validate
npx prisma migrate resolve --applied 20260806122819_init
npm run prisma:deploy
npm run build
npm run start:dev
```

Se _prisma_migrations já existe e a migração inicial está registrada, use:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:validate
npm run prisma:deploy
npm run build
npm run start:dev
```

## Migrações adicionais

- 20261001120000_database_completion: completa campos de contratante e cria eventos.
- 20261001150000_event_participation_requests: cria solicitações de participação em eventos.
- 20261001153000_chat_persistence: cria conversas e mensagens.

## Verificação

GET /health deve retornar status ok e database connected.

## Recursos persistentes

Autenticação, agentes, contratantes, edição de perfil, mapa, portfólio, projetos, candidaturas, avaliações, eventos, solicitações de participação, conversas e mensagens.

## API pública

POST /auth/register
POST /auth/login
GET /usuarios/agentes
GET /projetos
GET /projetos/:id
GET /eventos
GET /eventos/:id
GET /portfolio/:agenteId
GET /avaliacoes/agente/:agenteId
GET /health

## API autenticada

GET/PATCH /usuarios/me
GET /projetos/minhas
GET /projetos/minhas/candidaturas
GET /projetos/:id/candidaturas
POST/PATCH /projetos
POST /projetos/:id/candidaturas
PATCH /projetos/candidaturas/:id
POST/PATCH/DELETE /eventos
GET /eventos/minhas/solicitacoes
POST /eventos/:id/solicitacoes
PATCH /eventos/solicitacoes/:id
POST/PATCH/DELETE /portfolio
POST /avaliacoes/agente/:agenteId
GET /chat/conversas
POST /chat/conversas
POST /chat/agentes/:agenteId/conversa
GET /chat/conversas/:id/mensagens
POST /chat/conversas/:id/mensagens