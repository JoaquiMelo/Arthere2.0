import type { Palette } from './palettes';
import { readableColor } from './contrast';
import { dimensions } from './dimensions';
import { elevation } from './elevation';
import { motion } from './motion';
import { radius } from './radius';
import { spacing } from './spacing';
import { typography } from './typography';

export function createThemeTokens(palette: Palette) {
  const lightSurfaces = [palette.background, palette.white, palette.surface];
  const readable = (color: string) => readableColor(color, lightSurfaces);

  return {
    color: {
      ...palette,
      background: palette.background,
      surface: palette.white,
      surfaceElevated: palette.white,
      surfaceSubtle: palette.surface,
      surfaceStrong: palette.surfaceStrong,
      textPrimary: palette.brandInk,
      textSecondary: readable(palette.muted),
      textInverse: palette.brandPaper,
      textDisabled: palette.muted,
      border: palette.border,
      accent: palette.brandCoral,
      accentText: readable(palette.brandCoral),
      onAccent: readableColor(palette.brandPaper, [palette.brandCoral]),
      onAccentSecondary: readableColor(palette.brandInk, [palette.brandBlue]),
      accentOnInverse: readableColor(palette.brandCoral, [palette.brandInk]),
      accentStrong: palette.primaryDark,
      accentSoft: palette.brandSand,
      accentSecondary: palette.brandBlue,
      success: palette.brandGreen,
      warning: palette.brandTerracotta,
      danger: palette.danger,
      dangerText: readable(palette.danger),
      onDanger: readableColor(palette.brandPaper, [palette.danger]),
      successText: readable(palette.brandGreen),
      warningText: readable(palette.brandTerracotta),
      focus: readable(palette.brandCoral),
      disabled: palette.border,
      overlay: 'rgba(41, 36, 43, 0.56)',
    },
    typography,
    spacing,
    radius,
    elevation,
    motion,
    dimensions,
  } as const;
}

export type ThemeTokens = ReturnType<typeof createThemeTokens>;

export type ColorToken = keyof ThemeTokens['color'];
