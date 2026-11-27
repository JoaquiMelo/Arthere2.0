# Etapa 4.2 — Consistência visual e modo escuro

**Data:** 27/11/2026

**Base:** `5e2150b`, com a Etapa 3.6 aprovada.

**Situação:** implementação concluída e verificada no ambiente de desenvolvimento. A inspeção visual em aparelho continua pendente.

## Escopo

Mapeei a navegação de visitante, cadastro, pré-edição e áreas autenticadas dos três perfis. São 26 destinos de tela no navegador, mais o contêiner de abas. A inspeção partiu dos 90 módulos locais importados por `App.tsx` e incluiu as ramificações de perfil, modais e componentes compartilhados. Os fluxos receberam revisão estática em Claro e Escuro. Os resultados em aparelho ainda dependem de teste manual.

Skills aplicadas: **Arthere Design**, **Mobile App UX Auditor** e **Expo Design System**. A identidade editorial e as paletas Arthere, Oceano e Ameixa continuam como base.

## Achados e mudanças

| Prioridade | Área | Resultado |
| --- | --- | --- |
| P1 | Campos, botões e filtros | Contornos de separadores também eram usados para delimitar controles. Separei as duas funções e ajustei o foco em botões preenchidos sobre a própria cor de fundo. A seleção de texto e os cursores seguem o tema. |
| P1 | Preferência de aparência | A interface podia renderizar a paleta inicial antes de ler a escolha salva. Agora espera a leitura das preferências antes de renderizar. Claro e Escuro são aplicados também ao tema nativo, e Sistema devolve a escolha ao aparelho. O seletor de data e hora no iOS recebe o modo explicitamente. |
| P1 | Navegação inferior | A aba ativa ganhava um fundo pouco distinto no escuro. A indicação de seleção passou a usar o tom areia da paleta com primeiro plano próprio, com os rótulos contrabalançados pelo fundo da barra. |
| P2 | Mapas | Centralizei o estilo do mapa cultural e dos dois seletores de localização. No Android, o escuro usa cores de fundo, vias e rótulos do tema. O claro restaura o estilo padrão. No iOS, o modo é repassado ao mapa nativo. |
| P2 | Formulários e modais | Editores dos perfis, busca de oportunidades, chat e pesquisa no mapa usam teclado e cores coerentes com a opção do app. Os seletores de município usam a sobreposição do tema. |
| P2 | Cabeçalhos, tipografia e chat | Cabeçalhos com ações as reposicionam em uma linha própria quando a largura útil é pequena. As mensagens usam a tipografia compartilhada e superfícies distintas para envio e recebimento. |
| P2 | Agenda e perfil público | O sinal editorial de evento na agenda usa o mesmo tom de alto contraste da legenda. Datas no perfil público do organizador passam pelo mesmo dia civil de São Paulo usado na agenda. |

## Cobertura por fluxo

- **Ateliê, cadastro, entrada e pré-edição:** verifiquei cabeçalhos, botões, campos, contornos, estados vazios e skeleton do Ateliê. Os estados de erro e ocupação da 3.6 continuam integrados aos componentes revisados.
- **Mapa e agenda:** verifiquei filtros, legenda, status, eventos concluídos, capa e álbum, seleção de data e localização, e diferenças de provedor Android/iOS.
- **Oportunidades, gestão, chat e avaliações:** verifiquei hierarquia, busca, cards, formulários, chips, estados vazios, notas e botões de confirmação. O chat aproveita o novo contraste e usa a mesma escala do Design System.
- **Perfis, portfólio e configurações:** verifiquei superfícies, ícones, contraste, editores e modais. A opção Sistema continua disponível, assim como as três paletas e a persistência independente.
- A inspeção automatizada não encontrou literais hexadecimais ou RGB nas propriedades visuais de cor verificadas nas telas ativas. A observação exclui arquivos legados fora da navegação e não substitui inspeção de cores por categoria nos pinos, fotos ou controles nativos.

## Validações

| Verificação | Resultado |
| --- | --- |
| TypeScript, lint e `git diff --check` | Aprovados. |
| Contraste nas seis combinações de paleta e modo | Mínimos medidos de **4,53:1** para os textos verificados, **3,03:1** para contornos e foco, **9,53:1** entre o indicador ativo e a barra e **9,52:1** para os rótulos nos fundos verificados do mapa escuro. Medição estática sobre os tokens. |
| Preferências, modo nativo, Sistema e mapas | Simulação passou para leitura da preferência salva, alternância Claro/Escuro/Sistema e restauração do estilo padrão no Android. |
| Regressão de data | Um evento à noite em São Paulo depois da meia-noite UTC permanece no dia civil correto. |
| Exportações Android/iOS e Expo Go | Bundles exportados nos dois alvos. Metro iniciou em modo Expo Go. A execução real em aparelho está pendente. |
| Expo e dependências | A verificação de dependências em modo offline informou versões em dia com dados locais. Expo Doctor passou em 18 de 20. As consultas externas ao Expo e ao React Native Directory não responderam corretamente. |
| Prisma e API | Geração, validação e build NestJS aprovados. O health check de produção respondeu HTTP 200. A etapa não alterou o schema nem requer migração nova. |

## Checklist manual

- [ ] No iPhone 11 e em Android, testar as três paletas em Claro e Escuro. Fechar o app em Escuro e verificar a primeira tela ao reabrir.
- [ ] Alternar Claro, Escuro e Sistema nas Configurações e mudar a preferência do aparelho. Conferir teclado, seletor de data e hora, alertas e modais.
- [ ] Conferir a aba ativa, os campos e o foco com fonte ampliada. Testar as ações do cabeçalho de Oportunidades com uma conta de contratante.
- [ ] Abrir Mapa, seleção de local do evento e seleção de local do perfil. Trocar a aparência e conferir vias, rótulos, pinos e retorno do estilo claro.
- [ ] Conferir Ateliê, estados vazios, conversa, agenda e perfil público com um evento noturno. Observar contraste em foto, brilho baixo e luz forte.

**Próxima etapa recomendada:** validar em aparelho e confirmar a aprovação da 4.2 antes de iniciar a 4.3.
