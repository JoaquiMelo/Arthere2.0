# Arthere 2.0 — Backend

API NestJS + Prisma 7 + MySQL/MariaDB.

## Configuração

Crie `backend/.env` a partir de `.env.example`.

Importante: se a senha do MySQL tiver caracteres reservados em uma URL, como `@`, codifique o caractere. Por exemplo, `@` deve ser representado como `%40`.

Nunca envie `.env` para o GitHub.

## Banco existente

Esta versão não usa `prisma migrate reset` e não apaga os dados existentes.

Execute:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:validate
npm run prisma:deploy
npm run build
npm run start:dev
```

`prisma migrate deploy` aplica somente as migrações ainda não registradas. A migração `20261001120000_database_completion` complementa o banco inicial com os campos de contratante e a tabela de eventos.

## Verificação

Depois de iniciar a API:

```text
GET http://localhost:3000/health
```

Resposta esperada:

```json
{"status":"ok","database":"connected"}
```

## Recursos persistentes

- autenticação com JWT e senha com bcrypt;
- cadastro de agente criativo;
- cadastro de contratante com CPF/CNPJ, nome social e pronomes;
- edição de perfil;
- busca de agentes;
- portfólio;
- oportunidades/projetos;
- candidaturas;
- aceite/recusa de candidaturas;
- avaliações e cálculo da nota média;
- calendário de eventos;
- eventos premium/fixados;
- busca e filtros de eventos;
- autorização por proprietário;
- conexão real com MySQL/MariaDB.

## API

### Públicos

- `POST /auth/register`
- `POST /auth/login`
- `GET /usuarios/agentes`
- `GET /projetos`
- `GET /projetos/:id`
- `GET /eventos`
- `GET /eventos/:id`
- `GET /portfolio/:agenteId`
- `GET /avaliacoes/agente/:agenteId`
- `GET /health`

### Autenticados

- `GET/PATCH /usuarios/me`
- `POST/PATCH /projetos`
- `POST /projetos/:id/candidaturas`
- `GET /projetos/minhas/candidaturas`
- `GET /projetos/:id/candidaturas`
- `PATCH /projetos/candidaturas/:id`
- `POST/PATCH/DELETE /eventos`
- `POST/PATCH/DELETE /portfolio`
- `POST /avaliacoes/agente/:agenteId`
