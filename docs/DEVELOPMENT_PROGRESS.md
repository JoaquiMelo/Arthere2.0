# Arthere 2.0 — Acompanhamento do desenvolvimento

**Atualização:** 27/11/2026

**Etapa atual:** 4.1, auditoria geral pós-redesign. Revisão e correções concluídas no ambiente de desenvolvimento. Aguardando aprovação para seguir.

**Relatório e checklist:** [Auditoria da Etapa 4.1](audits/etapa-4.1.md)

## Roadmap

| Etapa | Estado |
| --- | --- |
| 1. Auditoria inicial | Concluída anteriormente. |
| 2. Design System e identidade visual | Implementada anteriormente. |
| 3. Redesign estrutural | Implementado. Testes de regressão em aparelho pendentes. |
| 4.1. Auditoria geral pós-redesign | Executada. Correções locais validadas. Publicação e testes em aparelho pendentes. |
| 4.2. Consistência visual e modo escuro | Aguardando aprovação da Etapa 4.1. |
| 4.3. Microinterações e acessibilidade | Planejada. |
| 4.4. Chat e avaliações | Planejada. |
| 4.5. Notificações internas e avaliação de push | Planejada. |
| 5.1 a 5.3. Segurança, desempenho e testes | Planejadas. |
| 6. Entrega e TCC | Planejada. Considerar Windows e iPhone 11 na estratégia de distribuição. |

## Funcionalidades e decisões

- O app mantém Expo, React Navigation e os papéis AGENTE, CE e CO. A API mantém NestJS, Prisma e MySQL/MariaDB. A produção usa Render.
- O Ateliê é a entrada principal e o mapa é uma aba própria. A Agenda distingue eventos futuros e concluídos. O organizador pode gerir o álbum de eventos concluídos.
- Cadastro, pré-edição, avatar e capa, portfólio, candidaturas, chat, avaliações e opções de aparência têm implementação. A confirmação em aparelho está detalhada no relatório.
- Mantive a navegação, a identidade editorial, os tokens e as paletas. A Etapa 4.1 corrigiu os campos devolvidos por chat, eventos e perfis públicos de agentes, ajustou a persistência de sessão e fez o Expo Go usar a API de produção por padrão.
- Skills aplicadas nesta etapa: Arthere Design e Mobile App UX Auditor.

## Validações e pendências

- TypeScript, lint, Prisma, build NestJS, migrações em MariaDB isolado, testes HTTP, simulação de sessão e exportação Android/iOS passaram.
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

**Próximo passo:** obter autorização para publicar a correção de privacidade. Após a aprovação da Etapa 4.1, começar pela revisão em modo claro e escuro da Etapa 4.2.
