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
- `tokens.ts`: cores semânticas derivadas da paleta ativa.
- `typography.ts`, `spacing.ts`, `radius.ts`, `elevation.ts` e `motion.ts`: escalas reutilizáveis.
- `index.ts`: ponto de exportação dos tokens.

Os componentes-base estão em `src/shared/components/`:
- `AppText`: variantes tipográficas e cores semânticas.
- `Button`: variantes, tamanhos, loading e estado desabilitado.
- `TextField`: label, foco, helper text e erro.
- `SectionHeader`: hierarquia editorial de seções.

Use `useTheme()` e `createThemeTokens(palette)` para consumir a paleta ativa. Durante a migração, mantenha os nomes legados em `colors.ts` para não quebrar telas ainda não convertidas. Novos componentes devem preferir tokens semânticos.
