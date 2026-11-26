import type { colors as baseColors } from './colors';
import { elevation } from './elevation';
import { motion } from './motion';
import { radius } from './radius';
import { spacing } from './spacing';
import { typography } from './typography';

type Palette = { [Key in keyof typeof baseColors]: string };

export function createThemeTokens(palette: Palette) {
  return {
    color: {
      ...palette,
      background: palette.background,
      surface: palette.white,
      surfaceElevated: palette.white,
      surfaceSubtle: palette.surface,
      surfaceStrong: palette.surfaceStrong,
      textPrimary: palette.brandInk,
      textSecondary: palette.muted,
      textInverse: palette.brandPaper,
      textDisabled: palette.muted,
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
    },
    typography,
    spacing,
    radius,
    elevation,
    motion,
  } as const;
}

export type ThemeTokens = ReturnType<typeof createThemeTokens>;
