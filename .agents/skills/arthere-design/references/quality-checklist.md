# Arthere Quality Gate

Avalie cada item como PASS, NEEDS WORK ou NOT APPLICABLE. Não marcar PASS sem evidência.

## Produto e fluxo
- [ ] Objetivo da tela é claro.
- [ ] Papel, autenticação e permissões estão corretos.
- [ ] Ação principal é evidente e funciona.
- [ ] Navegação de ida/volta é previsível.
- [ ] Dados e feedback refletem o estado real da API.

## Visual
- [ ] Hierarquia e ponto focal são claros.
- [ ] Tipografia, cores, espaçamento e raios seguem tokens.
- [ ] Conteúdo tem alinhamento e ritmo consistentes.
- [ ] Não há decoração gratuita ou excesso de containers.
- [ ] Imagens têm proporção, fallback e carregamento adequados.
- [ ] Textos longos, nomes e localizações não quebram o layout.

## Estados
- [ ] Loading inicial e durante mutações.
- [ ] Conteúdo preenchido.
- [ ] Empty state útil.
- [ ] Erro e recuperação/retry.
- [ ] Atualização e prevenção de ações duplicadas.
- [ ] Offline/timeout quando relevante.

## Mobile e acessibilidade
- [ ] Safe areas e barras do sistema.
- [ ] Teclado e rolagem.
- [ ] Alvos de toque e feedback.
- [ ] Contraste, labels e ordem de leitura.
- [ ] Fonte ampliada e telas pequenas.
- [ ] iOS e Android considerados.

## Engenharia
- [ ] TypeScript sem erros introduzidos.
- [ ] Sem dependências desnecessárias.
- [ ] Sem mocks substituindo integrações reais.
- [ ] Sem regressões em rotas, contratos ou permissões.
- [ ] Lint/test/build executados quando disponíveis.
- [ ] Diff revisado e escopo controlado.

## Resultado
- PASS: requisitos aplicáveis atendidos.
- NEEDS WORK: há falha que impede considerar a tela pronta.
- NOT APPLICABLE: item não se aplica, com motivo quando não óbvio.

Uma tarefa não precisa resolver todos os débitos preexistentes. Diferencie claramente problemas encontrados de regressões introduzidas.
