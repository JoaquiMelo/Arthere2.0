# Etapa 4.1 — Auditoria geral pós-redesign

**Data:** 27/11/2026

**Base auditada:** `7abc034` em `main`. O remoto `origin/main` apontava para o mesmo commit e a árvore de trabalho estava limpa.

**Correções:** `ef74665`, validadas no ambiente de desenvolvimento.

**Situação:** auditoria concluída no ambiente disponível. A validação em aparelho e a publicação dependem de aprovação.

## Escopo e método

- Revisei a estrutura do app React Native com Expo e React Navigation, os módulos da API NestJS, Prisma, migrações, configuração, documentação e o histórico recente.
- Cruzei as rotas e os providers com as consultas Prisma e os campos consumidos nas telas. Revisei os estados de carregamento, erro, vazio e atualização ao voltar para a tela.
- Usei as skills **Arthere Design** e **Mobile App UX Auditor**, com as referências de sistema visual, experiência mobile, checklist de qualidade e o modelo de auditoria de telas. O scanner encontrou 0 sinais P0, 31 P1 e 18 P2 em 95 arquivos do frontend. Esses números são heurísticos. O scanner também sinaliza arquivos sem rota ativa e usos estáticos da palavra “notification”. Os achados abaixo resultam da revisão do código e, quando indicado, de testes.
- Executei testes HTTP em NestJS com MariaDB isolado e contas de teste AGENTE, CONTRATANTE_EVENTOS (CE) e CONTRATANTE_OPORTUNIDADES (CO). Em produção, consultei somente `GET /health`.

## Achados confirmados e correções

| Prioridade | Fluxo | Evidência e efeito | Situação |
| --- | --- | --- | --- |
| P0 | Chat | A abertura e a listagem de conversas carregavam os registros completos dos dois usuários, incluindo o hash da senha e dados privados da conta e do perfil. Qualquer participante recebia a resposta. | Seleção explícita dos campos de identificação usados pelo app. O teste HTTP aprovou abertura, listagem, persistência e acesso restrito aos participantes. |
| P1 | Evento público e histórico de participação | A relação do organizador usava o cadastro completo, inclusive campos de documento, telefone e endereço. Os detalhes só precisam dos dados públicos de identificação e do local publicado no próprio evento. | As duas consultas devolvem um resumo do organizador. Os testes confirmaram que o detalhe, o pino e o histórico preservam os dados necessários. |
| P1 | Ateliê, mapa e perfil público de agente | As consultas públicas devolviam o endereço cadastral e o identificador interno da conta. O perfil público também enviava as coordenadas de quem desativou a visibilidade. | A listagem mantém os campos de descoberta, portfólio e coordenadas dos agentes visíveis. O detalhe omite endereço e identificador interno e entrega coordenadas nulas quando a visibilidade está desligada. |
| P1 | Sessão e troca de contas | Token e perfil eram gravados separadamente. Uma falha na segunda gravação podia deixar o token novo acompanhado do perfil anterior. A limpeza disparada por um 401 também podia concorrer com a gravação de outra sessão. | As novas sessões são gravadas juntas no SecureStore. Sessões legadas permanecem legíveis. O 401 limpa a sessão somente se o token ainda corresponder ao da consulta. Validado com armazenamento simulado e falha injetada. |
| P1 | Expo Go e API | Sem variável de ambiente, o app em desenvolvimento montava a URL a partir do endereço do Metro e da porta 3000. O padrão da API local era 3006. | Expo Go e builds usam a URL de produção como padrão. Uma URL de teste pode ser informada explicitamente por variável de ambiente. |

O mesmo ajuste na consulta de abertura do chat passou a retornar as 50 mensagens mais recentes, como a listagem. O cliente mantém a ordem cronológica ao exibi-las.

## Cobertura por área

| Área | Evidência revisada | Validação e limites |
| --- | --- | --- |
| Navegação, papéis e conta | Pilha pública, pré-edição por papel, abas com Ateliê inicial, rotas protegidas de CE e CO e providers remontados por identidade. | Os três papéis foram cadastrados na API isolada. A navegação e a troca de contas no Expo Go aguardam teste em aparelho. |
| Cadastro e pré-edição | Formulários por etapa, revisão do perfil, avatar e capa com seleção independente, reuso de upload após falha e ação de pular. | Upload autenticado, leitura do binário e persistência de avatar/capa passaram via HTTP. Galeria, permissões e prévia aguardam teste nativo. |
| Ateliê, mapa de agentes e mapa cultural | Carregamento ao ganhar foco, busca, estados de erro e vazio, camadas, pinos e rotas de detalhes. O Ateliê usa a visibilidade pública do agente como critério de descoberta. | A API confirmou visibilidade e coordenadas optativas. Marcadores, GPS, permissão negada e direções precisam ser verificados em aparelho. |
| Agenda e álbuns | Calendário, consulta ao voltar à tela, fuso de São Paulo e arquivo de concluídos. Álbum com verificação de propriedade na API. | Teste HTTP criou evento com pino, registrou participação antes da data, bloqueou após o encerramento e publicou uma foto com a conta organizadora. O limite de oito fotos e exclusão pelo aplicativo precisam de cobertura adicional. |
| Oportunidades e candidaturas | Ações por papel, listagem pública, painel do CO, recuperação de candidaturas e verificação de propriedade. | API confirmou publicação pelo CO, bloqueio para CE, candidatura de agente, rejeição de duplicata, recuperação do histórico e consulta de candidaturas pelo CO. Aprovação e recusa no app aguardam teste manual. |
| Chat e avaliações | Atualização ao abrir conversas, acesso por participante, notas persistidas, restrição por papel e unicidade de avaliação. | Testei envio, releitura, bloqueio de terceiro, nota média e avaliação duplicada. Leitura, ordenação após mensagens simultâneas e regras de elegibilidade ficam para 4.4. |
| Configurações e Design System | Aparência e paleta em chaves distintas, preferência do sistema, tokens semânticos, componentes de formulário e feedback compartilhados. | Revisão estática e exportação Android/iOS. Contraste renderizado, fonte ampliada, leitor de tela e persistência nativa ficam no checklist. |
| API, persistência e plataforma | Banco relacional, autenticação JWT, controle de proprietário, histórico de migrações e upload no MySQL. | As 11 migrações existentes foram aplicadas em MariaDB vazio. Nenhuma alteração de schema foi necessária nesta etapa. O teste não usou o banco de produção. |

## Pendências e riscos

| Prioridade | Estado | Evidência ou hipótese | Etapa |
| --- | --- | --- | --- |
| P0 | Publicação depende de aprovação | A correção do chat está apenas no commit local. O health check de produção não informa a revisão implantada. Se uma versão que devolvia hashes esteve publicada, confirme o período de exposição e avalie sessões e senhas conforme a evidência disponível. | Publicação controlada da correção |
| P2 | Confirmado em código | O perfil público do organizador formata a data do evento em UTC, diferente da agenda em São Paulo. Um horário noturno pode aparecer no dia seguinte. Revisar com um cenário perto da meia-noite. | 4.2 |
| P2 | Confirmado em código | Algumas telas antigas mantêm estilos locais e há arquivos sem entrada no navegador principal. O scanner também encontra controles com rótulos ou papéis que precisam de triagem em aparelho. | 4.2 e 4.3 |
| P2 | Confirmado em código | O cartão de agente no mapa oferece agendamento que exibe um aviso de indisponibilidade. A conversa já é o fluxo funcional. | Refinamento a aprovar |
| P2 | Confirmado em código | A API de chat grava a mensagem e tenta atualizar a conversa com um objeto vazio. O chat também recupera todo o histórico pela rota de mensagens, e a lista não tem estado persistido de leitura. Reproduzir ordenação após envio e medir conversas longas. | 4.4 e 5.2 |
| P2 | Requer decisão de produto | O contato público do contratante inclui telefone na rota de perfil. Candidaturas e solicitações autenticadas também trazem relações completas em alguns endpoints. Revisar fins, consentimento e necessidade de cada campo. | 5.1 |
| P2 | Hipótese a validar | Aceitação de candidaturas e agregação de avaliações fazem múltiplas operações. Os testes sequenciais passaram. Falta medir concorrência com requisições simultâneas. | 5.1 a 5.3 |
| P2 | Confirmado em código | A camada de requisições não define prazo máximo geral. A experiência de rede lenta e a recuperação precisam ser testadas. | 5.2 |
| P3 | Confirmado no repositório | A árvore Android do backend contém um keystore de debug, referenciado pelo Gradle local inclusive em release. Ainda é preciso confirmar qual projeto assina a entrega EAS. A busca restrita por padrões de chaves privadas e tokens em texto não encontrou ocorrências. | 5.1 e 6 |

## Comandos e resultados

| Verificação | Resultado |
| --- | --- |
| `npx tsc --noEmit` e `npm run lint` | Aprovados. |
| `npx expo install --check` | Online bloqueado pelo cache em diretório sem escrita. Offline informou dependências em dia com os dados locais. A comparação online continua pendente. |
| `npx expo-doctor` | 18 de 20. A checagem do schema Expo e a consulta ao React Native Directory falharam no acesso aos serviços externos. |
| `npm run prisma:generate`, `npm run prisma:validate`, `npm run build` | Aprovados no backend. |
| `npm run prisma:deploy` | As 11 migrações existentes passaram somente no MariaDB isolado. |
| Integração HTTP | Aprovada no backend local, com contas sintéticas. |
| Sessão | Simulação aprovada para leitura legada, falha de gravação, 401 de token antigo após mudança de conta e logout. |
| `GET https://arthere-api.onrender.com/health` | HTTP 200 com banco conectado. O endpoint não identifica o commit em produção. |
| `npx expo start -c --go` | Metro respondeu `packager-status:running`. A ferramenta de depuração usou fallback por falha no cache do ambiente. Nenhum aparelho foi conectado. |
| `npx expo export --platform android --platform ios` | Bundles Android e iOS exportados. A execução nativa permanece pendente. |
| `git diff --check` | Aprovado. |

## Checklist manual

- [ ] No iPhone 11 e em Android, abrir o Expo Go e confirmar que Ateliê, Mapa e Agenda carregam com a API configurada.
- [ ] Criar conta de cada papel e testar voltar entre etapas, escolher avatar/capa, pular a pré-edição, reabrir o app e conferir os dados.
- [ ] Sair da conta A, entrar na conta B e comparar perfil, conversas, candidaturas e solicitações. Repetir com rede lenta e com uma sessão expirada.
- [ ] Alterar visibilidade do agente e conferir Ateliê, mapa e perfil público. Cadastrar evento com GPS permitido, negado e pino manual.
- [ ] Abrir o pino e tocar em Como chegar. Comparar eventos do dia e concluídos na Agenda. Publicar álbum com a conta proprietária e confirmar sua exibição como visitante.
- [ ] Candidatar-se, fechar o app, retornar à oportunidade e conferir seu estado. Aprovar ou recusar a candidatura no painel do CO.
- [ ] Enviar e reler mensagens entre duas contas. Conferir avaliações e retenção dos dados após reiniciar.
- [ ] Alternar Claro, Escuro e Sistema nas três paletas. Verificar fonte ampliada, leitor de tela, teclado, modais e áreas seguras.

**Próxima etapa recomendada:** priorizar a autorização para publicar a correção de privacidade e executar o checklist nos aparelhos. Iniciar a Etapa 4.2 após a aprovação da Etapa 4.1.
