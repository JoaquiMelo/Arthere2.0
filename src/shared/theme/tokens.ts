import type { Palette } from './palettes';
import { readableColor } from './contrast';
import { dimensions } from './dimensions';
import { elevation } from './elevation';
import { motion } from './motion';
import { radius } from './radius';
import { spacing } from './spacing';
import { typography } from './typography';

export function createThemeTokens(palette: Palette, dark = false) {
  const ink = dark ? '#F6EEE7' : palette.brandInk;
  const background = dark ? '#19171D' : palette.background;
  const surface = dark ? '#232128' : palette.white;
  const subtle = dark ? '#302D35' : palette.surface;
  const accentSoft = dark ? '#372F38' : palette.brandSand;
  const secondary = dark ? '#C9BDC8' : palette.muted;
  const border = dark ? '#605662' : palette.border;
  const readable = (color: string) => readableColor(color, [background, surface, subtle, accentSoft]);

  return {
    color: {
      ...palette,
      background,
      surface,
      surfaceElevated: surface,
      surfaceSubtle: subtle,
      surfaceStrong: dark ? '#443947' : palette.surfaceStrong,
      textPrimary: ink,
      textSecondary: readable(secondary),
      textInverse: palette.brandPaper,
      textDisabled: secondary,
      border,
      accent: palette.brandCoral,
      accentText: readable(palette.brandCoral),
      onAccent: readableColor(palette.brandPaper, [palette.brandCoral]),
      onAccentSecondary: readableColor(palette.brandInk, [palette.brandBlue]),
      accentOnInverse: readableColor(palette.brandCoral, [palette.brandInk]),
      accentStrong: palette.primaryDark,
      accentSoft,
      accentSecondary: palette.brandBlue,
      success: palette.brandGreen,
      warning: palette.brandTerracotta,
      danger: palette.danger,
      dangerText: readable(palette.danger),
      onDanger: readableColor(palette.brandPaper, [palette.danger]),
      successText: readable(palette.brandGreen),
      warningText: readable(palette.brandTerracotta),
      focus: readable(palette.brandCoral),
      disabled: border,
      overlay: dark ? 'rgba(0, 0, 0, 0.68)' : 'rgba(41, 36, 43, 0.56)',
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
