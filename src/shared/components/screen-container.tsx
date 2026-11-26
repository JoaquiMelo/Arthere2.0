import type { ComponentProps } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';

type Props = ComponentProps<typeof SafeAreaView>;

/** Container de tela, sem scroll implícito (compatível com listas e mapas). */
export function ScreenContainer({ style, edges = ['top', 'left', 'right', 'bottom'], ...props }: Props) {
  const { color } = useThemeTokens();
  return <SafeAreaView {...props} edges={edges} style={[{ flex: 1, backgroundColor: color.background }, style]} />;
}
