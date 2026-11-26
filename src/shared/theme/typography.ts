export const typography = {
  family: {
    regular: undefined,
    medium: undefined,
    semibold: undefined,
    bold: undefined,
    heavy: undefined,
  },
  size: {
    display: 40,
    h1: 32,
    h2: 26,
    h3: 20,
    title: 18,
    body: 15,
    bodySmall: 13,
    label: 12,
    caption: 11,
    overline: 10,
  },
  lineHeight: {
    display: 46,
    h1: 38,
    h2: 32,
    h3: 26,
    title: 24,
    body: 23,
    bodySmall: 20,
    label: 16,
    caption: 15,
    overline: 13,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
    black: '900',
  },
  tracking: {
    tight: -0.8,
    normal: 0,
    wide: 0.8,
    overline: 1.4,
  },
} as const;

export type TypographyVariant = keyof typeof typography.size;
