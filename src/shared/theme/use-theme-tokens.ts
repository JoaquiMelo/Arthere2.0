import { useTheme } from '@/providers/theme-provider';

/** A mesma instância de tokens é compartilhada enquanto a paleta não muda. */
export function useThemeTokens() {
  return useTheme().tokens;
}
