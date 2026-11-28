# Etapa 4.5 — Arthere Intelligent Data Seed

## Banco principal MySQL no PowerShell

O modo compartilhado aceita somente o schema `db_arthere`. A URL do seed deve ter o mesmo host, porta e schema de `DATABASE_URL`. A credencial do seed deve ter acesso restrito ao schema. O seed usa `baixada` como identificador fixo no banco principal. Os registros continuarão visíveis e marcados como demonstrativos na API existente.

Antes da janela de manutenção, confirme com o DBA que o banco usa as migrations da versão atual, apenas tabelas InnoDB previstas do Arthere, incluindo a tabela operacional opcional `arthere_state`, e nenhuma referência entre schemas, trigger, rotina ou evento do MySQL. No grant do usuário do seed, escape o underscore de `db_arthere` para evitar um padrão de nomes. O seed usa o `mysqldump` do MySQL para o banco principal e verifica o TLS de destinos remotos. Caso o servidor use uma CA própria, informe o caminho de seu PEM em `DEMO_SEED_TLS_CA`, tanto para o dump como para a conexão. Se `mysqldump.exe` estiver fora do PATH, informe seu caminho em `DEMO_SEED_DUMP_BIN`.

No arquivo **local e não versionado** `backend/.env`, configure `DATABASE_URL` com a referência da API e `DEMO_SEED_DATABASE_URL` com a credencial de manutenção. Use a codificação percentual de caracteres especiais nas URLs. Defina `DEMO_SEED_PASSWORD` com a senha aleatória das três contas e `DEMO_SEED_ARTIFACT_DIR` com um diretório absoluto privado fora do Git, com ACL restrita. Deixe `DEMO_SEED_ALLOW_WRITE=false` e `DEMO_SEED_ALLOW_PRIMARY_DATABASE=false` no arquivo. `DEMO_SEED_BATCH_ID=baixada` e `DEMO_SEED_RANDOM_SEED=20261128` fixam a configuração inicial. As variáveis ficam na sessão do PowerShell durante a operação, sem alterações nas configurações do Render.

```powershell
git pull --ff-only origin main
Set-Location backend
npm ci
npm run prisma:generate
$env:DEMO_SEED_ALLOW_PRIMARY_DATABASE = 'true'
$env:DEMO_SEED_ALLOW_WRITE = 'false'
$env:DEMO_SEED_BATCH_ID = 'baixada'
$env:DEMO_SEED_DUMP_CLIENT = 'mysql'
npm run seed:demo:preview
if ($LASTEXITCODE -ne 0) { throw 'Resolva os conflitos da prévia.' }
```

Suspenda as escritas da API durante o backup e a carga. Rode os passos seguintes após sua aprovação manual. O backup é verificado pelo comando de backup e novamente pelo comando de carga. Se `arthere_state` existir, a verificação exige sua definição no dump e, se houver registros, os comandos de inserção. A carga e a limpeza conferem o conteúdo de `arthere_state` antes e depois, na mesma transação. A carga compara os dados preexistentes antes e depois, incluindo hashes de senha e mídia, dentro da transação. A saída inclui somente o resultado da verificação, sem valores reais.

```powershell
$backupJson = npm run --silent seed:demo:backup
if ($LASTEXITCODE -ne 0) { throw 'Backup falhou. A carga foi interrompida.' }
$backup = $backupJson | Out-String | ConvertFrom-Json
if (-not $backup.id) { throw 'Recibo de backup inválido.' }
try {
  $env:DEMO_SEED_ALLOW_WRITE = 'true'
  npm run seed:demo -- --batch baixada --confirm db_arthere --backup $backup.id
  if ($LASTEXITCODE -ne 0) { throw 'Carga interrompida.' }
  npm run seed:demo:validate -- --batch baixada
  if ($LASTEXITCODE -ne 0) { throw 'Validação detectou divergências.' }
} finally {
  $env:DEMO_SEED_ALLOW_WRITE = 'false'
}
```

Para remoção em outra janela de manutenção, rode `npm run seed:demo:clean:preview -- --batch baixada`. Se estiver livre de bloqueios, gere um **novo** backup como no bloco acima e substitua o comando de população por `npm run seed:demo:clean -- --batch baixada --confirm db_arthere --backup $backup.id`. Uma referência externa ou alteração no lote bloqueia a limpeza inteira. Por exemplo, uma candidatura real para um evento demonstrativo permanece intacta, junto do evento. A limpeza nunca remove por e-mail ou por nome. Após a operação, encerre a sessão ou remova as autorizações do PowerShell.

```powershell
Remove-Item Env:DEMO_SEED_ALLOW_PRIMARY_DATABASE -ErrorAction SilentlyContinue
Remove-Item Env:DEMO_SEED_ALLOW_WRITE -ErrorAction SilentlyContinue
```

## Auditoria e modelo

A aplicação usa NestJS, Prisma 7, MariaDB/MySQL e Expo SDK 58. O seed usa o cliente gerado e os modelos existentes.

- `Usuario` tem e-mail único e perfil de `AgenteCriativo` ou `Contratante`. Os dois papéis de contratante usam a mesma tabela com permissões distintas. A autenticação usa bcrypt com custo 12.
- `Portfolio` guarda um trabalho por linha. Os 50 portfólios são grupos de três trabalhos, e `Projeto` continua sendo a tabela das vagas. Documento, telefone e endereço pessoal ficam vazios.
- O evento usa a data civil em São Paulo para determinar seu encerramento. As 30 publicações são 17 futuras, 3 na data de referência e 10 concluídas. O modelo guarda `premium` e `fixado`. O mesmo indicador `fixado` aparece como destaque. Fechamento antecipado de inscrições e andamento manual dependem de campos que o modelo atual não oferece.
- Solicitações e candidaturas têm unicidade por agente e publicação. Vagas têm no máximo uma candidatura aceita. As 53 avaliações resultam de 50 participações aceitas em eventos concluídos e de três vagas concluídas. Os pares de agente e contratante são únicos.
- `UploadImagem` armazena bytes, e a API serve as mídias em `/uploads`. As coordenadas usam pontos aproximados em áreas urbanas e foram comparadas às malhas dos nove municípios da Baixada Santista.

| Entidade | Solicitação | Planejado e criado no teste isolado |
| --- | ---: | ---: |
| Agentes criativos | 50 | 50 |
| Contratantes de eventos | 10 | 10 |
| Contratantes de oportunidades | 15 | 15 |
| Usuários | 75 | 75 |
| Portfólios | 50 | 50 |
| Trabalhos de portfólio | 150 | 150 |
| Eventos | 30 | 30 |
| Oportunidades | 10 | 10 |
| Solicitações de evento | ~120 | 120 |
| Candidaturas a vagas | ~40 | 40 |
| Avaliações | ~250 | 53, todas com histórico concluído |
| Álbuns e imagens | — | 10 álbuns e 350 imagens |

O lote de teste `banca-qa` foi criado em `127.0.0.1:33328/arthere_demo_showcase`, validado e removido após o teste. Em produção, zero registros foram criados.

## Isolamento e rastreabilidade

No modo de demonstração isolada, use um database MySQL/MariaDB separado com nome `arthere_demo_*`, inclusive se o servidor for compartilhado. A execução recusa um alvo com o nome do database em `DATABASE_URL`, grants globais, grants por padrão de nomes, tabelas inesperadas, engines não transacionais, triggers ou referências visíveis entre schemas. A conta do banco deve ter acesso exclusivamente ao schema demonstrativo. O DBA também deve confirmar a ausência de referências de outros schemas que o usuário restrito não tenha permissão de ver.

A API de demonstração roda separadamente, com acesso restrito, credenciais próprias e `JWT_SECRET` diferente. Aponte o Expo para essa API por `EXPO_PUBLIC_API_URL`. Mantenha o acesso do app normal no destino habitual. Use somente contas de teste na API demonstrativa. Os nomes de perfis, publicações, trabalhos e avaliações incluem **Demonstração**.

O seed cria sua tabela de controle apenas no schema autorizado, durante a primeira população confirmada. As migrations existentes são suficientes para os modelos da aplicação. Uma transação serializável com bloqueio de linha grava registros, imagens, manifesto de IDs e assinatura dos dados em conjunto. Concorrência é serializada. Uma execução repetida com os mesmos parâmetros preserva o lote existente. Se a conexão cair, consulte o relatório e rode novamente usando a mesma configuração.

A limpeza compara todos os IDs das tabelas da aplicação com o manifesto. Qualquer registro adicional bloqueia a limpeza, inclusive candidaturas, mensagens, usuários ou uploads criados enquanto se testava o app. Com o tráfego da API suspenso, use a prévia para investigar. Para reapresentar depois de interações de teste, também é possível preparar um novo schema demonstrativo. O processo aceita registros do próprio lote já ausentes. O histórico do lote removido é preservado.

## Configurar o ambiente demonstrativo

1. Use Node 24 e instale as dependências no diretório `backend` com `npm ci`. Tenha `mariadb-dump` no PATH.
2. Solicite ao administrador um database dedicado e um usuário com acesso somente a ele. Em MariaDB, **escape os underscores** no privilégio de database para evitar curingas, por exemplo, ``GRANT ALL PRIVILEGES ON `arthere\_demo\_banca`.* TO ...``. A confirmação do administrador deve abranger as referências entre schemas. Use TLS verificável para hosts remotos.
3. Em um ambiente próprio, aponte `DATABASE_URL` para o database demonstrativo somente ao executar `npm run prisma:deploy` e `npm run prisma:generate` ou iniciar a API demonstrativa. Para o seed, informe o destino em `DEMO_SEED_DATABASE_URL` e mantenha `DATABASE_URL` vazio ou apontando para o database normal.
4. Crie um diretório privado fora do repositório e configure `DEMO_SEED_ARTIFACT_DIR` para seu caminho absoluto. Em Linux/macOS, use permissão `700`. Configure `DEMO_SEED_PASSWORD` por variável de ambiente ou segredo local. Use uma senha aleatória entre 20 e 72 bytes. O administrador fornece as credenciais por canal privado.
5. Escolha `DEMO_SEED_BATCH_ID` se quiser substituir o padrão `baixada`. `DEMO_SEED_RANDOM_SEED` controla o conteúdo e os IDs. `DEMO_SEED_ANCHOR` é opcional e usa o dia de São Paulo por padrão. A data gravada no manifesto é reaproveitada nas execuções seguintes.

### Prévia, backup e população

Execute a prévia antes de solicitar aprovação de um destino remoto.

```bash
npm run seed:demo:preview
npm run seed:demo:backup
```

A prévia funciona offline sem `DEMO_SEED_DATABASE_URL`. Com o destino definido, verifica migrations, grants, conflitos e conteúdo sem gravar no database. O backup cria um dump consistente em transação única, compacta, verifica formato e conclusão do dump e grava o SHA-256, tamanho, destino e horário. Preserve o dump e o recibo juntos em armazenamento privado. Suspenda alterações da API antes do backup e mantenha o ambiente sem tráfego de escrita até concluir a operação.

Com a aprovação para o **destino demonstrativo**, ative `DEMO_SEED_ALLOW_WRITE=true` na sessão e passe o nome exato do database e o ID emitido pelo backup dos últimos 24 h.

```bash
npm run seed:demo -- --confirm arthere_demo_banca --backup ID_DO_BACKUP
npm run seed:demo:validate
npm run seed:demo:report
npm run seed:demo:report -- --batch baixada --full-manifest
```

A validação retorna código diferente de zero em caso de divergências. O relatório completo inclui IDs, hashes e créditos. Para usar o app, inicie uma instância separada da API e configure o Expo para essa instância, acessível na rede privada do aparelho. As contas padrão são `baixada.agente-01@example.com`, `baixada.eventos-01@example.com` e `baixada.oportunidades-01@example.com`. Somente essas três contas recebem a senha configurada. As outras recebem hash bcrypt de um segredo aleatório descartado. O seed usa domínios reservados e não dispara comunicações.

### Limpeza e restauração

```bash
npm run seed:demo:clean:preview -- --batch baixada
npm run seed:demo:backup
npm run seed:demo:clean -- --batch baixada --confirm arthere_demo_banca --backup NOVO_ID_DO_BACKUP
```

A limpeza aplica filtros explícitos de IDs em ordem de dependência, mantém o manifesto e verifica que os registros foram removidos. Para atualizar a programação, faça uma nova prévia com outro lote depois de limpar ou prepare um database demonstrativo separado.

Para testar uma restauração, use outro servidor ou instância descartável **sem o database homônimo**. Confira o SHA-256 e o gzip antes de importar. Em Linux, rode `sha256sum ARQUIVO.sql.gz` e `gzip -t ARQUIVO.sql.gz`; compare os resultados com o recibo. Importe na instância descartável com `gzip -dc ARQUIVO.sql.gz | mariadb --host HOST_ISOLADO --user ADMIN --password`. O dump carrega o nome original do database. Confira contagens, migrations, manifesto e imagens na restauração. Utilize acesso interativo ou arquivo de opções privado para a senha. A restauração em ambiente compartilhado exige avaliação individual do DBA.

## Imagens

O pipeline roda offline. Usa sete imagens de acervo Wikimedia Commons com licença verificada por arquivo, versão dimensionada e hash fixado em `backend/prisma/seed/demo/media/catalog.json`. Os créditos acompanham as descrições correspondentes e o manifesto. O restante usa ilustrações originais, incluindo os 75 avatares sintéticos. As imagens de trabalhos e álbuns são ilustrativas. Cada mídia passa por validação de formato, dimensões, tamanho e hash, com fallback original para arquivo de acervo indisponível ou alterado. Os bytes são persistidos no MariaDB, e o seed não precisa contratar armazenamento ou usar chaves externas.

## Validação e escopo

`npm run seed:demo:test` verifica geração determinística, integridade de datas, geolocalização, fallback e operação offline. Para executar também a suíte de rollback, concorrência e limpeza, forneça `DEMO_SEED_TEST_DATABASE_URL` apontando para um MariaDB local descartável com as migrations aplicadas e o schema vazio.

### Resultados da verificação

- A adaptação para o banco compartilhado passou em MySQL 8.4.8 descartável com o cliente oficial `mysqldump`. Prévia, backup, carga, validação e limpeza preservaram o usuário de controle e seu hash de senha. Os oito testes automatizados também passaram com MariaDB isolado, incluindo o bloqueio de uma candidatura externa ligada a um evento demonstrativo.

- Os seis testes automatizados passaram, incluindo rollback de uma falha após o início da transação, execução concorrente com uma única criação e proteção de um usuário fora do manifesto.
- A API NestJS no ambiente isolado confirmou login nos três papéis, filtros por cidade e especialidade, coordenadas, portfólios, permissão de candidaturas, eventos, álbuns, vagas e mídias persistidas. A prévia Expo Web usou essa mesma API para conferir início, perfil, portfólio, calendário, álbum e vagas. O componente nativo do mapa ficou isolado na prévia web.
- Todos os 80 pontos gravados ficaram dentro dos polígonos dos municípios correspondentes. [Malhas municipais do IBGE](https://servicodados.ibge.gov.br/api/docs/malhas?versao=3)
- O dump foi verificado e restaurado em uma segunda instância descartável. A restauração confirmou 75 contas, 150 trabalhos, 30 eventos e 350 imagens. A limpeza recusou um backup adulterado e uma execução sem confirmação.
- A geração e a validação do Prisma, o build NestJS, TypeScript e lint do frontend e a verificação de dependências do Expo passaram. O backend não tem um script de lint próprio. O Expo Doctor completou 18 de 20 verificações. O schema online e o React Native Directory ficaram bloqueados por falha externa. O teste em aparelho físico continua pendente.

A implementação está em `backend/prisma/seed/demo/`. Foram adicionados Faker com localização pt-BR e Resvg como dependências de desenvolvimento. As tabelas e rotas da API e o frontend mantêm os mesmos contratos. As alterações de configuração do repositório são `backend/package.json`, seu lockfile e `backend/.env.example`.

A fase de escrita no banco atual exige aprovação explícita. O modo compartilhado é manual e o deploy no Render não chama comandos de seed.
