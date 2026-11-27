# Arthere 2.0 — Acompanhamento do desenvolvimento

**Atualização:** 27/11/2026

**Etapa atual:** 4.3, microinterações e acessibilidade. Implementação e verificações de desenvolvimento concluídas. Validação em aparelho pendente.

**Relatórios e checklists:** [Etapa 4.3](audits/etapa-4.3.md) · [Etapa 4.2](audits/etapa-4.2.md) · [Etapa 3.6](audits/etapa-3.6.md) · [Auditoria da Etapa 4.1](audits/etapa-4.1.md)

## Roadmap

| Etapa | Estado |
| --- | --- |
| 1. Auditoria inicial | Concluída anteriormente. |
| 2. Design System e identidade visual | Implementada anteriormente. |
| 3. Redesign estrutural | Implementado. Testes de regressão em aparelho pendentes. |
| 3.6. Microinterações, acessibilidade e acabamento | Aprovada para prosseguir. Testes em aparelho pendentes. |
| 4.1. Auditoria geral pós-redesign | Executada. Correções locais validadas. Publicação e testes em aparelho pendentes. |
| 4.2. Consistência visual e modo escuro | Aprovada para prosseguir. Testes em aparelho pendentes. |
| 4.3. Microinterações e acessibilidade | Implementada e verificada em desenvolvimento. Testes em aparelho pendentes. |
| 4.4. Chat e avaliações | Aguardando aprovação da 4.3. |
| 4.5. Notificações internas e avaliação de push | Planejada. |
| 5.1 a 5.3. Segurança, desempenho e testes | Planejadas. |
| 6. Entrega e TCC | Planejada. Considerar Windows e iPhone 11 na estratégia de distribuição. |

## Funcionalidades e decisões

- O [calendário regional](audits/calendario-regional.md) tem grade mensal editorial, agenda cronológica, visão anual e detalhes redesenhados. Os filtros usam a programação da API e a aba Concluídos exibe os álbuns publicados.

- O app mantém Expo, React Navigation e os papéis AGENTE, CE e CO. A API mantém NestJS, Prisma e MySQL/MariaDB. A produção usa Render.
- A tela inicial Arthere apresenta a marca manuscrita, busca e vitrines de agentes por área. O mapa é uma aba própria. A Agenda usa a tipografia anterior do calendário e distingue eventos futuros e concluídos. O organizador pode gerir o álbum de eventos concluídos.
- Cadastro, pré-edição, avatar e capa, portfólio, candidaturas, chat, avaliações e opções de aparência têm implementação. A confirmação em aparelho está detalhada no relatório.
- Mantive a navegação, a identidade editorial, os tokens e as paletas. A Etapa 4.1 corrigiu os campos devolvidos por chat, eventos e perfis públicos de agentes, ajustou a persistência de sessão e fez o Expo Go usar a API de produção por padrão.
- A Etapa 3.6 adicionou suporte à preferência de movimento, feedback de carregamento e confirmação, e refinou a acessibilidade dos controles e formulários. Skills aplicadas: Arthere Design, Mobile App UX Auditor e Expo Animation.

- A Etapa 4.2 alinhou contrastes, campos nativos, barra de abas e mapas às opções de aparência, revisou o chat e tratou a data do perfil público. Skills aplicadas: Arthere Design, Mobile App UX Auditor e Expo Design System.

- A Etapa 4.3 refinou foco do leitor de tela, teclado, carregamento e confirmações nos fluxos ativos. Skills aplicadas: Arthere Design, Mobile App UX Auditor e Expo Animation.

## Validações e pendências

- TypeScript, lint, Prisma, build NestJS, migrações em MariaDB isolado, testes HTTP, simulação de sessão e exportação Android/iOS passaram.
- Na 3.6, passaram os testes simulados de envio único no chat e preservação de rascunho, a verificação estática de contraste e a exportação Android/iOS. VoiceOver, TalkBack e feedback tátil aguardam teste em aparelho.
- Na 4.2, passaram a medição de contraste nas seis combinações de paleta e modo, a simulação de preferências e mapas, e os bundles Android/iOS. O relatório registra o que precisa de inspeção visual em aparelho.
- Na 4.3, passaram as simulações de foco, teclado, envio único e carregamento acessível, além dos bundles Android/iOS. Leitores de tela, permissões e feedback tátil em aparelho continuam no checklist.
- No ajuste visual da tela inicial e da Agenda, passaram TypeScript, lint e as exportações Android/iOS. A prévia isolada no Chromium verificou os temas claro e escuro, busca, filtros, acesso a perfis e a seleção de datas. A inspeção em aparelho está pendente.
- Metro iniciou para Expo Go. A API de produção respondeu ao health check. A validação completa com Expo Doctor e a comparação online de dependências ficaram pendentes pelas limitações registradas no relatório.
- A revisão encontrou exposição de dados privados nas respostas de chat, evento e agente. O código foi corrigido em desenvolvimento. O ambiente de produção requer autorização para atualizar a API e confirmar a versão efetivamente publicada.
- O modo escuro, GPS, permissões nativas, troca de contas e fluxos ponta a ponta em aparelho ainda requerem validação manual.

## Commits relevantes

- `ef74665` — proteção dos dados da API e integridade da sessão.
- `7abc034` — Ateliê, mapa cultural e modo escuro. Base da auditoria.
- `3d2840c` — avatar e capa na pré-edição.
- `51c3467` — redesign da configuração de perfil.
- `a787505` — arquivo de eventos concluídos e álbuns.
- `78ed3a3` — recuperação do estado das candidaturas pela API.

**Próximo passo:** obter autorização para publicar a correção de privacidade. Validar as etapas 3.6, 4.2 e 4.3 em aparelho. A Etapa 4.4 aguarda aprovação.
