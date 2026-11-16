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

### Testar a API

Com o backend em execução, utilize a URL base `http://localhost:3006` (ou o endereço/IP e a porta configurados no servidor).

**Verificar se a API e o banco estão funcionando:**

```http
GET http://localhost:3006/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "database": "connected"
}
```

Outras rotas públicas para testes:

- `POST /auth/register` — cadastrar usuário.
- `POST /auth/login` — autenticar usuário.
- `GET /usuarios/agentes` — listar agentes.
- `GET /projetos` — listar oportunidades/projetos.
- `GET /eventos` — listar eventos.
- `GET /portfolio/:agenteId` — consultar portfólio de um agente.

As rotas que exigem autenticação devem receber o token JWT no cabeçalho `Authorization: Bearer <token>`. Consulte [backend/README.md](backend/README.md) para a relação de rotas, métodos HTTP e requisitos de autenticação.

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

A API oferece `POST /uploads/image` (JWT obrigatório, campo multipart `file`) para armazenar imagens em disco e retornar uma URL pública. São aceitos JPG, PNG, WEBP, GIF e HEIC, com limite de 10 MB por arquivo. O mobile pode usar `uploadImage(uri, nome, mimeType)` em `src/services/api.ts`; o método envia multipart sem sobrescrever o cabeçalho boundary.

Configure `PUBLIC_API_URL` com a URL pública da API para que os links retornados sejam acessíveis pelo aplicativo. O diretório padrão é `backend/uploads`; configure `UPLOADS_DIR` para apontar para um volume persistente na hospedagem. **É obrigatório montar um volume persistente nesse caminho**: o disco efêmero de containers pode apagar as imagens em novos deploys.

A migração `20261116120000_image_uploads` adiciona `bannerUrl` aos perfis de agente/contratante e `imageUrl` aos eventos. A seleção da imagem na interface deve enviar o arquivo com `uploadImage` e salvar a URL retornada no perfil, evento ou item de portfólio.
