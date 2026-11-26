export const radius = {
  none: 0,
  xs: 6,
  sm: 10,
  control: 12,
  button: 14,
  cardCompact: 16,
  card: 18,
  panel: 22,
  sheetCompact: 24,
  modal: 28,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radius;
