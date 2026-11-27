# Etapa 3.6 — Microinterações, acessibilidade e acabamento

**Data:** 27/11/2026

**Base:** `e439744`, com as correções locais da auditoria 4.1.

**Escopo:** fluxo ativo do app, componentes compartilhados e os problemas confirmados de interação. As etapas 4.2 e seguintes aguardam aprovação.

## Achados e alterações

| Prioridade | Onde | Alteração |
| --- | --- | --- |
| P1 | Chat | Bloqueio síncrono contra envio em dobro, indicador de envio e erro em linha. A mensagem digitada permanece após falha. Se a pessoa começar a próxima mensagem enquanto aguarda, o novo rascunho é preservado. Carregamento do histórico e erro têm estados próprios. |
| P1 | Acessibilidade de controles | Botões mantêm o rótulo durante carregamento, têm estado ocupado e foco visível. Campos compartilham rótulo, instrução e estado desabilitado. Os controles dos editores de perfil, da conversa e do seletor de localização receberam rótulos, papéis e alvos de toque mais claros. |
| P1 | Movimento reduzido | A pilha nativa e os seletores que deslizavam usam transição em opacidade com movimento reduzido. A preferência do sistema é acompanhada enquanto o app estiver aberto. Os enquadramentos programáticos do mapa respeitam a preferência, e o pino da seleção de local fica estático ao arrastar. |
| P2 | Carregamento e retorno | O Ateliê mostra espaços reservados estáticos e um texto de carregamento. Erros de cadastro, chat e estados compartilhados têm indicação para leitores de tela. |
| P2 | Confirmações e formulários | A resposta visual permanece em todas as ações. Eventos, álbuns e novas vagas também fornecem feedback tátil após confirmação da API. Os editores de perfil usam áreas seguras, cabeçalho e botão compartilhados, e bloqueiam salvamentos simultâneos. O seletor do perfil solicita localização ao acionar o GPS ou a busca de endereço no Android. |

## Validação

- Skills aplicadas: **Arthere Design**, **Mobile App UX Auditor** e **Expo Animation**. Usei as referências de acessibilidade, movimento e transições nativas. Mantive transições da plataforma e feedback imediato ao toque.
- Scanner estático: de **31 para 12 sinais P1** e **18 sinais P2** antes e depois. São heurísticas. A contagem restante inclui rotas antigas fora do navegador ativo e itens que precisam de teste manual.
- TypeScript e lint aprovados. Prisma gerado e validado, e build NestJS aprovado. A etapa não introduziu mudanças no backend ou no schema. O endpoint de saúde da API respondeu HTTP 200.
- Os bundles de Android e iOS foram exportados. O Metro chegou ao estado de espera em modo Expo Go, com fallback para a ferramenta de depuração por restrição de cache.
- Em simulação, passaram a atualização da preferência de movimento e a remoção do listener, o rótulo e estado ocupado do botão, e o envio único com toques repetidos e preservação do rascunho após sucesso ou falha.
- As cores de texto, foco, erro e preenchimento dos componentes revisados passaram na verificação estática de contraste para as três paletas em claro e escuro. A aparência renderizada ainda precisa de checagem em aparelho.
- `expo install --check` informou dependências em dia com os metadados locais em modo offline. O Expo Doctor passou em 18 de 20 verificações. A consulta de schema do Expo e a consulta ao React Native Directory foram bloqueadas por falhas de acesso.

## Checklist em aparelho

- [ ] No iPhone 11 com VoiceOver e em Android com TalkBack, percorrer cadastro, edição de perfil, chat e mapa. Conferir rótulos, ordem, foco, botões ocupados e anúncios com falha de rede.
- [ ] Aumentar a fonte do sistema. Conferir o cabeçalho, texto do botão durante o envio e acesso ao salvar com o teclado aberto em tela pequena.
- [ ] Ativar e desativar Reduzir Movimento. Abrir e voltar de telas, abrir seletores e reenquadrar ambos os mapas. Verificar a ausência de deslocamento programático animado com a opção ativa.
- [ ] Com rede lenta, abrir o Ateliê e o chat. Tocar duas vezes em Enviar e testar falha e nova tentativa. Confirmar que uma mensagem seguinte digitada enquanto o envio anterior aguarda permanece no campo.
- [ ] Confirmar a resposta tátil ao publicar uma vaga, salvar um evento ou publicar um álbum. Repetir com a vibração desativada e conferir a confirmação visual.
- [ ] Testar permissão de localização negada, seleção manual, busca por endereço e retorno ao editor do perfil.
- [ ] Conferir claro e escuro nas três paletas e observar tempo de resposta das transições em um build de distribuição.

A implementação da 3.6 está pronta para validação em aparelho. Publicação e início da 4.2 seguem aguardando autorização.
