# Arthere API

## Banco real
1. Copie `.env.example` para `.env`.
2. Configure `DATABASE_URL` com seu MySQL/MariaDB.
3. Defina `JWT_SECRET`.
4. Execute `npm install`.
5. Execute `npx prisma generate`.
6. Execute `npx prisma migrate deploy`.
7. Execute `npm run start:dev`.

O cadastro público aceita somente AGENTE e CONTRATANTE. ADMIN não pode ser criado pelo endpoint público.