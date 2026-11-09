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

## Testar a API

Com o servidor iniciado, a API fica disponível na porta definida pela variável `PORT`. Na configuração padrão do projeto, utilize:

```text
http://localhost:3006
```

Em outro computador ou celular na mesma rede, substitua `localhost` pelo IPv4 da máquina que executa o backend. Em servidor remoto, utilize o domínio ou IP público configurado.

### Verificação de saúde — Health Check

- **Método:** GET
- **Rota:** `/health`
- **Autenticação:** não exige token.
- **Finalidade:** verifica a resposta da API e a conexão com o banco de dados.

Exemplo:

```http
GET http://localhost:3006/health
```

Resposta esperada — HTTP 200:

```json
{
  "status": "ok",
  "database": "connected"
}
```

Se a API estiver acessível, mas o banco não responder, a verificação falhará.

### Rotas públicas

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cadastro de usuário |
| POST | `/auth/login` | Login e obtenção do token JWT |
| GET | `/health` | Verificação da API e do banco |
| GET | `/usuarios/agentes` | Listagem de agentes |
| GET | `/usuarios/agentes/:id` | Detalhes públicos de um agente |
| GET | `/usuarios/contratantes/:id` | Detalhes públicos de um contratante |
| GET | `/projetos` | Listagem de projetos/oportunidades |
| GET | `/projetos/:id` | Detalhes de um projeto |
| GET | `/eventos` | Listagem de eventos |
| GET | `/eventos/:id` | Detalhes de um evento |
| GET | `/portfolio/:agenteId` | Portfólio de um agente |
| GET | `/avaliacoes/agente/:agenteId` | Avaliações de um agente |

As listagens de agentes, projetos e eventos aceitam filtros por query string, conforme os parâmetros implementados nos respectivos controllers.

### Rotas autenticadas

As rotas abaixo exigem o cabeçalho:

```http
Authorization: Bearer SEU_TOKEN_JWT
```

**Usuários**

| Método | Rota | Descrição |
|---|---|---|
| GET | `/usuarios/me` | Consultar o próprio perfil |
| PATCH | `/usuarios/me` | Atualizar o próprio perfil |

**Projetos e candidaturas**

| Método | Rota | Descrição |
|---|---|---|
| GET | `/projetos/minhas` | Listar projetos do usuário |
| GET | `/projetos/minhas/candidaturas` | Listar candidaturas do usuário |
| GET | `/projetos/:id/candidaturas` | Listar candidaturas de um projeto |
| POST | `/projetos` | Criar projeto/oportunidade |
| PATCH | `/projetos/:id` | Atualizar projeto |
| POST | `/projetos/:id/candidaturas` | Candidatar-se a um projeto |
| PATCH | `/projetos/candidaturas/:id` | Atualizar candidatura |

**Eventos e solicitações de participação**

| Método | Rota | Descrição |
|---|---|---|
| GET | `/eventos/minhas/solicitacoes` | Listar solicitações do usuário |
| POST | `/eventos` | Criar evento |
| PATCH | `/eventos/:id` | Atualizar evento |
| DELETE | `/eventos/:id` | Remover evento |
| POST | `/eventos/:id/solicitacoes` | Solicitar participação em evento |
| PATCH | `/eventos/solicitacoes/:id` | Atualizar solicitação |

**Portfólio e avaliações**

| Método | Rota | Descrição |
|---|---|---|
| POST | `/portfolio` | Criar item de portfólio |
| PATCH | `/portfolio/:id` | Atualizar item de portfólio |
| DELETE | `/portfolio/:id` | Remover item de portfólio |
| POST | `/avaliacoes/agente/:agenteId` | Avaliar agente |

**Chat**

Todas as rotas de chat exigem autenticação.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/chat/conversas` | Listar conversas |
| POST | `/chat/conversas` | Criar conversa |
| POST | `/chat/agentes/:agenteId/conversa` | Criar conversa com agente |
| GET | `/chat/conversas/:id/mensagens` | Listar mensagens |
| POST | `/chat/conversas/:id/mensagens` | Enviar mensagem |

### Exemplos de teste no PowerShell

Verificar a API:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3006/health"
```

Listar agentes:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3006/usuarios/agentes"
```

Listar eventos:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3006/eventos"
```

Para testar rotas autenticadas, primeiro faça login em `POST /auth/login`, copie o token retornado e envie-o no cabeçalho `Authorization: Bearer SEU_TOKEN_JWT`.

## Recursos persistentes

Autenticação, agentes, contratantes, edição de perfil, mapa, portfólio, projetos, candidaturas, avaliações, eventos, solicitações de participação, conversas e mensagens.
