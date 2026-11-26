# Design System — Arthere

## Regra principal
Antes de criar ou alterar estilos, localize o tema, tokens, componentes compartilhados e convenções já existentes. Este documento define o que o sistema deve cobrir; não invente valores nem sobrescreva a identidade existente sem auditoria.

## Tokens necessários
- Cores semânticas: background, surface, surface-elevated, text-primary, text-secondary, border, accent, success, warning, danger, disabled, overlay.
- Tipografia: famílias sem serifa existentes, tamanhos, pesos, line-height e estilos de título/corpo/legenda/label.
- Espaçamento: escala consistente baseada em múltiplos previsíveis.
- Forma: raios para controles, cards, modais e superfícies.
- Elevação: níveis discretos e compatíveis com iOS/Android.
- Ícones: uma família consistente, tamanhos e espessuras coerentes.
- Movimento: duração, easing e transições padronizadas.

## Componentes compartilhados recomendados
Button (primary/secondary/tertiary/destructive), IconButton, TextField, SearchField, SelectField, Chip/Filter, Card, Avatar, Badge/Status, EmptyState, ErrorState, LoadingState, Skeleton, Modal/Sheet, Toast/InlineFeedback, SectionHeader e ListRow.

Não criar todos de uma vez. Identifique padrões repetidos no código e evolua o sistema por necessidade real.

## Regras de implementação
- Tokens são a fonte da verdade; evitar cores e espaçamentos mágicos repetidos.
- Componentes devem ter variantes explícitas, estados disabled/loading/focused e contratos tipados.
- Tema claro/escuro, se existente, deve manter contraste e semântica.
- Não usar dimensões fixas quando conteúdo dinâmico, fonte ampliada ou telas pequenas exigirem flexibilidade.
- Componentes devem aceitar acessibilidade e automação de testes.
- Respeitar convenções de estilo e organização do repositório.

## Auditoria de consistência
Compare telas que fazem tarefas semelhantes. Verifique alturas de botões, campos, raios, espaçamento, títulos, estados e padrões de navegação. Diferenças precisam ser intencionais.

## Implementação atual no repositório

A fundação compartilhada está em `src/shared/theme/`:
- `colors.ts`: paleta de marca e aliases legados.
- `palettes.ts`: fonte única das três paletas Arthere, Oceano e Ameixa.
- `contrast.ts`: cálculo de contraste e adaptação de primeiro plano para as paletas claras.
- `dimensions.ts`: alvos de toque, alturas mínimas, ícones e largura de referência.
- `tokens.ts`: cores semânticas derivadas da paleta ativa.
- `typography.ts`, `spacing.ts`, `radius.ts`, `elevation.ts` e `motion.ts`: escalas reutilizáveis.
- `index.ts`: ponto de exportação dos tokens.

Os componentes-base estão em `src/shared/components/`:
- `AppText`: variantes tipográficas e cores semânticas.
- `Button`: variantes, tamanhos, loading e estado desabilitado.
- `TextField`: label, foco, helper text e erro.
- `SectionHeader`: hierarquia editorial de seções.

Use `useThemeTokens()` de `@/shared/theme/use-theme-tokens` para consumir a instância memoizada no ThemeProvider. Use `useTheme()` quando precisar selecionar a paleta ou acessar aliases legados. `createThemeTokens(palette)` permanece disponível para uso fora de componentes. Durante a migração, mantenha os nomes legados em `colors.ts` para não quebrar telas ainda não convertidas. Novos componentes devem preferir tokens semânticos.

## Consolidação — etapa 3.2

- A marca original permanece intacta. `accent`, `danger`, `success` e `warning` são cores de preenchimento/destaque. Para texto sobre superfícies claras use `accentText`, `dangerText`, `successText` e `warningText`. Para texto sobre preenchimentos use `onAccent`, `onAccentSecondary` e `onDanger`. `accentOnInverse` é a cor de destaque sobre grafite.
- Os primeiros planos adaptados buscam relação de contraste mínima 4,5:1 nas superfícies claras das três paletas; não substituem verificação visual em contexto, sobretudo sobre imagens e fundos não previstos.
- Botões usam altura mínima de 44/48/56 dp; campos usam 48 dp e a escala tipográfica compartilhada. Não fixar a altura quando o conteúdo pode crescer.
- O NavigationContainer recebe as cores do tema sem trocar rotas. A prévia das paletas nas Configurações usa a mesma fonte de dados do provider.
- Não criar diretório paralelo de UI. Evoluir `src/shared/components/` na etapa 3.3. Telas ainda com cores estáticas serão migradas por módulo; não considerar a migração visual global concluída.

## Componentes globais — etapa 3.3

A partir desta etapa, importar de `@/shared/components` para os novos módulos. Os componentes existentes continuam disponíveis, sem uma segunda pasta de UI.

| Componente | Contrato de uso |
| --- | --- |
| IconButton | `icon`, `accessibilityLabel` obrigatório, `onPress`, `variant`, `size`, `disabled`, `loading`; alvo mínimo de 44 dp. |
| FilterChip | `label`, `selected`, `onPress`, `icon`, `disabled`; a seleção pertence ao chamador. Marca visual e estado acessível de seleção. |
| Badge | `label`, `tone` (neutral/accent/success/warning/danger), `icon`; apenas informação, sem toque. |
| ScreenHeader | `title`, `kicker`, `description`, `onBack`, `action`; não acoplar à navegação. |
| ScreenContainer | SafeAreaView com fundo temático, `edges` configurável; não envolve o conteúdo em ScrollView. Em abas, evitar duplicar a área segura inferior que a barra já cobre. |
| FeedbackState | `kind` (loading/empty/error), `title`, `description`, `icon`, `onRetry`; uma base para os três estados, sem componentes duplicados. |
| Avatar / MediaImage | `uri`, `style`, `icon`, `iconSize`, `resizeMode`; imagens reais, fallback local, cache e tentativas limitadas. |

Adoção inicial: filtros e limpeza de busca na agenda, status de participações do agente, cabeçalho/container/feedback no chat e feedback de carregamento/erro do perfil público. O calendário mantém sua seleção e os handlers originais. A migração ampla das telas continua nas etapas 3.4–3.9. Não alterar os providers de sessão, mídia persistente nem os contratos da API apenas para aplicar componentes visuais.

Para o mapa (3.4), usar ScreenContainer sem scroll implícito, ScreenHeader para hierarquia e ações, FilterChip para categorias reais e IconButton para controles com rótulos. Não sobrepor áreas seguras nem impedir gestos do mapa. Testar fonte ampliada, iOS/Android e as três paletas.
