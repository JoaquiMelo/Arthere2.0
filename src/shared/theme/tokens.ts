import type { colors as baseColors } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';
import { typography } from './typography';

type Palette = typeof baseColors;

export function createThemeTokens(palette: Palette) {
  return {
    color: {
      background: palette.brandPaper,
      surface: palette.white,
      surfaceSubtle: palette.surface,
      surfaceStrong: palette.surfaceStrong,
      textPrimary: palette.brandInk,
      textSecondary: palette.muted,
      textInverse: palette.brandPaper,
      border: palette.border,
      accent: palette.brandCoral,
      accentStrong: palette.primaryDark,
      accentSoft: palette.brandSand,
      accentSecondary: palette.brandBlue,
      success: palette.brandGreen,
      warning: palette.brandTerracotta,
      danger: palette.danger,
      disabled: palette.border,
      overlay: 'rgba(41, 36, 43, 0.56)',
      ...palette,
    },
    typography,
    spacing,
    radius,
  } as const;
}

export type ThemeTokens = ReturnType<typeof createThemeTokens>;
