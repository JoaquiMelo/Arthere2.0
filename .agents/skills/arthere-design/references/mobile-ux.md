# Mobile UX — React Native + Expo

## Estrutura e navegação
- Siga a estrutura Expo Router já existente; não criar um segundo sistema de navegação.
- Preserve o comportamento de autenticação e o acesso condicionado por papel.
- A navegação principal deve manter previsibilidade e contexto; evite destinos duplicados e telas sem saída.
- Use back behavior consistente com iOS e Android.

## Layout e interação
- Respeite safe areas e barras de sistema.
- Garanta alvos de toque confortáveis (referência: 44–48 dp quando viável).
- Considere teclado, scroll-to-focus, dismiss keyboard, autofill e tipos corretos de teclado.
- Evite scrolls aninhados, conteúdo encoberto e ações primárias fora da área confortável.
- Listas longas devem considerar virtualização e desempenho.
- Mapa deve preservar gestos de pan/zoom e não conflitar com scroll, filtros ou bottom sheets.

## Estados de tela
Para cada consulta/mutação, prever conforme aplicável:
- Inicial/carregando.
- Conteúdo disponível.
- Vazio (com explicação e próxima ação útil).
- Erro (mensagem humana e retry quando seguro).
- Atualizando/pull-to-refresh.
- Sem conexão ou timeout.
- Ação em andamento e resultado confirmado.

## Dados e formulários
- Não apresentar sucesso antes da confirmação da API.
- Prevenir toque duplo em ações não idempotentes.
- Preservar dados digitados após erro recuperável.
- Mostrar validação perto do campo e explicar como corrigir.
- Diferenciar erro de validação, autorização, rede e servidor sem expor detalhes internos.

## Perfis, portfólios e conteúdo
- Priorize nome, área, localização e conteúdo profissional relevante.
- Fotografias e trabalhos devem ter proporções consistentes, carregamento e fallback.
- Metadados não devem competir com o conteúdo criativo.
- Ações de contato, avaliação e candidatura devem respeitar permissões e estado real.

## Plataforma
Verifique diferenças de comportamento e APIs nas versões instaladas. Não presumir que API web, CSS ou pacote nativo não instalado esteja disponível.
