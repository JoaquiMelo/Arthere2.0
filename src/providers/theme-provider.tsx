import React, { createContext, useContext, useMemo, useState } from 'react';

import { palettes, type Palette, type PaletteName } from '@/shared/theme/palettes';
import { createThemeTokens, type ThemeTokens } from '@/shared/theme/tokens';

export { palettes } from '@/shared/theme/palettes';
export type { PaletteName } from '@/shared/theme/palettes';

type ThemeContextValue = {
  paletteName: PaletteName;
  palette: Palette;
  tokens: ThemeTokens;
  setPalette: (name: PaletteName) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [paletteName, setPaletteName] = useState<PaletteName>('Arthere');
  const palette = palettes[paletteName];
  const tokens = useMemo(() => createThemeTokens(palette), [palette]);

  const value = useMemo(
    () => ({ paletteName, palette, tokens, setPalette: setPaletteName }),
    [paletteName, palette, tokens],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme deve ser utilizado dentro de ThemeProvider.');
  }

  return context;
}

