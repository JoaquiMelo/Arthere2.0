# Motion & Interaction Guidelines

## Princípios
- Motion comunica causa e efeito, continuidade, hierarquia, progresso ou feedback.
- Cada animação precisa de propósito; se não melhora entendimento ou resposta, remova.
- Priorize fluidez e estabilidade em aparelhos modestos.
- Não atrasar navegação nem bloquear ações essenciais.

## Padrões
- Press feedback: resposta imediata e discreta.
- Screen transition: coerente com a navegação e plataforma.
- Expand/collapse: indicar relação entre controle e conteúdo.
- Loading: skeleton ou indicador adequado ao tempo e contexto.
- Success/error: feedback contextual, sem depender apenas de cor ou animação.
- Gesture: oferecer affordance e alternativa acessível quando o gesto não for óbvio.

## Implementação
- Primeiro procure animações e dependências já usadas no projeto.
- O projeto usa React Native Reanimated; confirme as APIs compatíveis com a versão instalada.
- Respeite reduce motion quando suportado.
- Evite loops contínuos, parallax exagerado, bounce decorativo e animações em grandes listas.
- Haptics apenas para ações significativas e com fallback silencioso.
- Limpe listeners, shared values e callbacks conforme os padrões da biblioteca.

## Verificação
Testar interrupção, navegação rápida, baixa performance, telas pequenas e estados de erro. A animação nunca deve esconder o estado real da operação.
