# Mobile UX — React Native + Expo

## Estrutura e navegação
- Siga React Navigation 7 (Bottom Tabs + Native Stack), arquitetura existente; não introduzir Expo Router nem um segundo sistema de navegação.
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

## Mapa — etapa 3.4
- A descoberta começa no mapa; busca e categorias são compartilhadas com a visualização em lista.
- O mapa ocupa o espaço restante da tela, sem ScrollView vertical envolvendo gestos. A lista usa FlatList e atualização por gesto.
- Marcadores nativos evitam depender da captura de avatares remotos no mapa. Fotos reais ficam nas linhas da lista e no cartão do profissional.
- Enquadrar resultados usa somente coordenadas cadastradas válidas. A região inicial é uma referência geográfica, não a localização do dispositivo.
- Não deduzir disponibilidade a partir de campos ausentes nem tratar todos os profissionais como designers. Outras especialidades são agrupadas em Outras áreas.
- O modal de profissional tem rolagem, ações explícitas, safe area e feedback de conexão. Agendamento direto ainda não tem implementação real; a ação informativa não promete enviar uma solicitação.
- A barra inferior preserva as cinco rotas e usa as áreas seguras calculadas pelo navegador, sem altura fixa. Testar fontes ampliadas, teclado, gestos, dispositivos pequenos e as três paletas.
