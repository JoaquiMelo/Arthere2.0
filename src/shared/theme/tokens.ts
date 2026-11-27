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
  const surfaces = [background, surface, subtle, accentSoft];
  const readable = (color: string) => readableColor(color, surfaces);
  const focus = readable(palette.brandCoral);
  const surfaceInverse = dark ? surface : palette.brandInk;
  const selectionInverse = palette.brandSand;

  return {
    color: {
      ...palette,
      background,
      surface,
      surfaceElevated: surface,
      surfaceSubtle: subtle,
      surfaceStrong: dark ? '#443947' : palette.surfaceStrong,
      surfaceInverse,
      selectionInverse,
      onSelectionInverse: readableColor(palette.brandInk, [selectionInverse]),
      textPrimary: ink,
      textSecondary: readable(secondary),
      textInverse: palette.brandPaper,
      textOnSurfaceInverse: readableColor(palette.brandPaper, [surfaceInverse]),
      textDisabled: secondary,
      border,
      controlBorder: readableColor(border, surfaces, 3),
      accent: palette.brandCoral,
      accentText: readable(palette.brandCoral),
      onAccent: readableColor(palette.brandPaper, [palette.brandCoral]),
      onAccentSecondary: readableColor(palette.brandInk, [palette.brandBlue]),
      accentOnInverse: readableColor(palette.brandCoral, [surfaceInverse]),
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
      focus,
      selection: `${focus}40`,
      disabled: border,
      overlay: dark ? 'rgba(0, 0, 0, 0.68)' : 'rgba(41, 36, 43, 0.56)',
    },
    typography,
    keyboardAppearance: dark ? 'dark' as const : 'light' as const,
    spacing,
    radius,
    elevation,
    motion,
    dimensions,
  } as const;
}

export type ThemeTokens = ReturnType<typeof createThemeTokens>;

export type ColorToken = keyof ThemeTokens['color'];
