# Arthere 2.0

Versão do Arthere com persistência real via API NestJS + Prisma + MySQL/MariaDB.

## O que mudou
- Removidos dados mockados da nova versão.
- Cadastro e login persistem no banco.
- Senhas são armazenadas com bcrypt.
- Sessão usa JWT e SecureStore.
- Perfis de agente e contratante são persistidos.
- Oportunidades/projetos e candidaturas usam Prisma.
- Eventos são carregados do banco.
- O endpoint público de cadastro aceita somente AGENTE ou CONTRATANTE; ADMIN não pode ser criado pelo app.

## Backend
`cd backend`, copie `.env.example` para `.env`, configure `DATABASE_URL` e `JWT_SECRET`, depois:
`npm install`
`npx prisma generate`
`npx prisma migrate deploy`
`npm run start:dev`

## Mobile
Na raiz:
`npm install`

Defina `EXPO_PUBLIC_API_URL` apontando para o IP/host onde a API NestJS está rodando. Em aparelho físico, use o IP da máquina na rede local em vez de `localhost`.

## Observação
Esta versão não inclui seed de dados fictícios. Após a migração, listas vazias são esperadas até usuários, projetos e eventos reais serem cadastrados.
