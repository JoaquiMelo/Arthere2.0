# Arthere 2.0

Aplicativo móvel completo do Arthere conectado a uma API NestJS + Prisma 7 + MySQL/MariaDB.

## Frontend

A interface foi trazida do projeto completo Arthere_, incluindo mapa regional de agentes, busca e filtros, perfis de agente e contratante, edição de perfil, portfólio, oportunidades e candidaturas, calendário regional, eventos premium/destaques, solicitações de participação, avaliações, chat e configurações.

Os recursos principais não dependem de dados de demonstração. Quando não há registros, a interface apresenta o estado vazio real.

## Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:validate
npm run prisma:deploy
npm run build
npm run start:dev
```

O backend não executa prisma migrate reset. Para banco existente, siga backend/README.md.

## Mobile

```bash
npm install
npx expo start -c
```

Configure EXPO_PUBLIC_API_URL no .env da raiz do mobile. Em aparelho físico, use o IPv4 do computador na rede local, não localhost.

## Persistência

As migrações adicionais desta versão são:

- 20261001120000_database_completion
- 20261001150000_event_participation_requests
- 20261001153000_chat_persistence

Elas adicionam campos de contratante, eventos, solicitações de participação, conversas e mensagens sem resetar o banco.

## Imagens

O portfólio aceita URL pública http/https para persistência. A seleção de imagem local funciona como pré-visualização; upload binário para servidor ainda não faz parte desta versão.