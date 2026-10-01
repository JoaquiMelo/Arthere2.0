# Arthere 2.0

Aplicação mobile com API NestJS, Prisma 7 e MySQL/MariaDB para persistência real.

## Banco de dados

O backend usa Prisma 7 com `@prisma/adapter-mariadb`. A URL fica no `prisma.config.ts` para comandos do Prisma, enquanto a aplicação monta o adapter MariaDB a partir da mesma URL.

1. Entre em `backend/`.
2. Copie `.env.example` para `.env`.
3. Crie o banco MySQL/MariaDB informado em `DATABASE_URL`.
4. Instale as dependências: `npm install`.
5. Gere o client: `npm run prisma:generate`.
6. Valide o schema: `npm run prisma:validate`.
7. Aplique as migrations: `npm run prisma:deploy`.
8. Inicie a API: `npm run start:dev`.

Para desenvolvimento local, `prisma migrate dev` também pode ser usado depois que o banco estiver criado.

### Variáveis

```env
PORT=3000
DATABASE_URL="mysql://usuario:senha@localhost:3306/arthere_db"
JWT_SECRET="use-uma-chave-secreta-forte"
DATABASE_CONNECTION_LIMIT=10
DATABASE_CONNECT_TIMEOUT=5000
DATABASE_ACQUIRE_TIMEOUT=10000
```

## Funcionalidades persistidas

- Cadastro e login de agentes e contratantes.
- Senhas com bcrypt e sessão JWT.
- Perfil completo do agente.
- Perfil completo do contratante, incluindo CPF/CNPJ, nome social e pronomes.
- Busca de agentes por cidade, especialidade e texto.
- Portfólio com criar, editar, listar e remover.
- Oportunidades/projetos com criação, edição, filtros e detalhes.
- Candidaturas com consulta e atualização de status pelo contratante.
- Avaliações de agentes com nota média calculada no banco.
- Calendário de eventos com busca, filtros, destaques premium/fixados, detalhes e CRUD do contratante.
- Relacionamentos e exclusões em cascata definidos no Prisma.

## Mobile

Na raiz do projeto:

```bash
npm install
```

Configure `EXPO_PUBLIC_API_URL` apontando para a API NestJS. Em aparelho físico, use o IP da máquina na rede local, por exemplo `http://192.168.0.10:3000`, e não `localhost`.

## Observação

O código agora não depende de dados mockados para autenticação, perfis, projetos, candidaturas, portfólio, avaliações ou eventos. Para dados iniciais de demonstração, eles devem ser cadastrados pela API/app ou por um seed separado.
