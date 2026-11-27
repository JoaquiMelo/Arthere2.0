# Calendário regional do Arthere 2.0

## Auditoria e direção visual

| Prioridade | Fluxo | Evidência no calendário anterior | Alteração |
| --- | --- | --- | --- |
| P1 | Descobrir a programação | Ações de busca ocupavam o topo e os títulos disputavam espaço dentro das células. | Cabeçalho compacto, mês em destaque, indicadores por dia e programação da seleção abaixo da grade. |
| P1 | Navegar entre períodos | A grade começava no domingo e a navegação de meses era sequencial. | Semana de segunda a domingo, datas adjacentes e visão anual de 12 meses com contagens. |
| P2 | Comparar eventos | A lista agrupava por destaque, desconectando a ordem dos meses. | Agenda cronológica agrupada por mês, com uma visualização própria para Destaques. |
| P2 | Entender um evento | A capa e o título dividiam um painel pesado. | Capa com selo, título editorial, data, horário, local e ações junto das informações de participação. |

## Comportamento

- Calendário e ano contam os mesmos eventos filtrados, incluindo os concluídos. Agenda e Destaques mostram a programação futura e do dia. Concluídos reúne os eventos passados em ordem decrescente e usa a primeira foto do álbum quando disponível.
- A grade representa datas civis em São Paulo. Os indicadores de quantidade, destaque, premium, seleção e hoje usam números, ícones ou sublinhado além da cor.
- A visão anual agrupa a lista já recebida pelo calendário. A busca, a cidade, a categoria e os filtros de premium e destaque são compartilhados. A agenda também pode ser limitada ao mês selecionado. O modelo de evento traz cidade em texto livre.
- A edição e a exclusão passam pelo formulário existente do proprietário. O perfil do contratante mantém as solicitações recebidas. O agente consulta sua solicitação e pode participar quando autorizado. A data do evento determina quando novas solicitações encerram e quando o álbum fica disponível. O backend existente valida os papéis e a propriedade.
- O compartilhamento usa a folha nativa de Android e iOS com título, data, horário e local. Favoritos sincronizados dependem de armazenamento por usuário e API. Adicionar ao calendário nativo depende de uma integração como `expo-calendar`, permissões e definição de término. Encerrar manualmente candidaturas, iniciar e finalizar dependem de estados e endpoints de ciclo de vida, que o contrato atual de eventos não oferece.

## Arquivos

- Criados: `calendar-event-row.tsx` e `calendar-year-grid.tsx`.
- Modificados: `agenda-calendar.tsx`, `event-agenda.ts`, `events-screen.tsx` e `event-details-screen.tsx`.
- Documentação: este relatório, o acompanhamento de desenvolvimento e o guia do Design System.

## Validação

- TypeScript, lint, verificação de versões do Expo e exportações Android e iOS passaram.
- Os testes de datas passaram em São Paulo, Honolulu e Kiritimati, incluindo meses de quatro a seis semanas, dia bissexto e virada de ano.
- A prévia isolada em Chromium verificou os três perfis, seleções, navegação de mês e ano, ordem e contagens, filtros, detalhe, situação da candidatura, álbum e tema escuro em 320 px. Criação e edição foram refletidas ao voltar à Agenda, que também removeu um evento retirado da resposta da API. A prévia usou dados e respostas de teste, com o mapa nativo isolado.
- A auditoria estática não acrescentou ocorrências às 29 já registradas no projeto, com zero sinais P0.
- O Expo Doctor passou 18 das 20 verificações. A validação do schema online e a consulta ao React Native Directory não completaram por falhas de comunicação.
- Permanecem pendentes os testes em aparelho, incluindo VoiceOver, TalkBack, compartilhamento nativo e confirmação de exclusão.

## Teste local

Com a `main` atualizada, rode `npm ci` e `npx expo start -c`. Abra no Expo Go compatível ou no cliente de desenvolvimento e vá à aba **Agenda**. Teste troca de mês, visão anual, filtros e abertura de um evento. Para verificar criação, edição, exclusão e candidatura, use contas de teste em uma API de homologação indicada por `EXPO_PUBLIC_API_URL`.
