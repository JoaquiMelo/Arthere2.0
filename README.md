# Arthere 2.0

Versão do Arthere com persistência real via API NestJS + Prisma + MySQL.

## Estrutura
- `src/`: aplicativo Expo/React Native.
- `backend/`: API NestJS.
- `backend/prisma/`: schema e migrations.

## Banco
Configure `backend/.env` localmente com `DATABASE_URL` e `JWT_SECRET`. Nenhuma credencial real é versionada.
