# Etapa 4.3 — Microinterações e acessibilidade

**Data:** 27/11/2026.

**Base:** `27e34b1`. A aprovação da 4.2 foi registrada para dar continuidade ao desenvolvimento.

A Etapa 3.6 estabeleceu as transições nativas, o suporte a Reduzir Movimento e a proteção contra envios repetidos no chat. A 4.3 fecha lacunas de foco, teclado e retorno nos cadastros, formulários e modais.

## Achados e correções

| Prioridade | Fluxo | Resultado |
| --- | --- | --- |
| P1 | Entrada, cadastro e formulários | A tecla Próximo percorre os campos de acesso e os campos iniciais de vagas. No cadastro e na entrada, a tentativa inválida direciona o foco ao primeiro campo de texto a corrigir. As validações de cidade, estado e termos continuam com mensagens explícitas. O teclado fecha quando começa um envio válido de conta, vaga, evento ou avaliação. |
| P1 | Leitor de tela | A etapa do cadastro e os títulos dos modais de portfólio e avaliação recebem foco quando o leitor de tela está ativo. A verificação ignora referências que perderam o vínculo com a tela durante a navegação. A nota das avaliações é lida como um único valor. |
| P2 | Carregamento | Ateliê e Oportunidades usam os mesmos espaços reservados estáticos. O leitor de tela recebe o texto de carregamento e ignora as formas decorativas. |
| P2 | Confirmação e ações em curso | O álbum mostra a quantidade de fotos e confirma visualmente o salvamento. A avaliação dá retorno tátil após a confirmação da API, junto ao aviso visual. O modal de avaliação preserva o rascunho durante uma tentativa de envio e bloqueia o fechamento enquanto a operação está em andamento. |
| P2 | Legibilidade e toque | O controle para mostrar a senha permanece alinhado ao campo em fonte ampliada e é desabilitado durante a entrada. O portfólio prioriza títulos e descrições, e os alvos das estrelas interativas seguem a medida do Design System. |

Os ajustes usam as mesmas áreas seguras, transições nativas e preferência de movimento da 3.6. A etapa usa **Arthere Design**, **Mobile App UX Auditor** e **Expo Animation**. O scanner estático passou de 12 para 11 sinais P1 e manteve 18 P2. A contagem inclui falsos positivos e telas fora do navegador ativo.

## Validações

- TypeScript, lint e verificação do diff aprovados.
- Simulações aprovadas para foco de leitor de tela, referências desmontadas, navegação pelo teclado no login e cadastro, aceitação dos termos antes de registrar, envio único por toque repetido e leitura do carregamento.
- Exportações Android/iOS concluídas e Metro verificado em modo Expo Go.
- Prisma gerado e validado. Build NestJS aprovado. A API de produção respondeu HTTP 200 no health check. Nenhuma migração nova é necessária.
- O Expo Doctor aprovou 18 de 20 verificações. Duas consultas externas ficaram indisponíveis. A verificação offline de dependências usou os metadados locais.

## Checklist em aparelho

- [ ] No iPhone 11 com VoiceOver e no Android com TalkBack, avançar e voltar entre as etapas de cadastro. Conferir se etapa e título são anunciados. Abrir e fechar um item de portfólio e o modal de avaliação.
- [ ] Com fonte ampliada, verificar a leitura da nota, a posição do controle Mostrar senha e o acesso às ações com o teclado aberto em tela pequena.
- [ ] Usar Próximo no login, cadastro e formulário de vaga. Testar credenciais inválidas, termos desmarcados, campos vazios e falha de rede. Conferir o foco e a preservação dos dados.
- [ ] Abrir Ateliê e Oportunidades com rede lenta, comprovar que apenas o texto do carregamento é anunciado e repetir em modo de movimento reduzido.
- [ ] Salvar um álbum e enviar uma avaliação com uma conta autorizada. Conferir confirmação, vibração, contador de fotos e comportamento do botão Voltar durante o envio.

**Próxima etapa recomendada:** executar o checklist com o app em aparelho e aprovar a 4.3 antes de iniciar a 4.4.
