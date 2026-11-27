import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { palettes, type Palette, type PaletteName } from '@/shared/theme/palettes';
import { createThemeTokens, type ThemeTokens } from '@/shared/theme/tokens';

export { palettes } from '@/shared/theme/palettes';
export type { PaletteName } from '@/shared/theme/palettes';

type ThemeContextValue = {
  paletteName: PaletteName;
  palette: Palette;
  tokens: ThemeTokens;
  setPalette: (name: PaletteName) => void;
  paletteSaveFailed: boolean;
};

const PALETTE_KEY = 'arthere.palette';

function readPalette(): Promise<string | null> {
  if (Platform.OS === 'web') return Promise.resolve().then(() => localStorage.getItem(PALETTE_KEY));
  return SecureStore.getItemAsync(PALETTE_KEY);
}

function savePalette(name: PaletteName): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve().then(() => localStorage.setItem(PALETTE_KEY, name));
  return SecureStore.setItemAsync(PALETTE_KEY, name);
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [paletteName, setPaletteName] = useState<PaletteName>('Arthere');
  const [paletteSaveFailed, setPaletteSaveFailed] = useState(false);
  const changeVersion = useRef(0);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const palette = palettes[paletteName];
  const tokens = useMemo(() => createThemeTokens(palette), [palette]);

  useEffect(() => {
    let active = true;
    void readPalette().then((stored) => {
      if (active && changeVersion.current === 0 && stored && Object.hasOwn(palettes, stored)) {
        setPaletteName(stored as PaletteName);
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const setPalette = useCallback((name: PaletteName) => {
    const version = ++changeVersion.current;
    setPaletteName(name);
    setPaletteSaveFailed(false);
    writes.current = writes.current.then(() => savePalette(name)).catch(() => {
      if (version === changeVersion.current) setPaletteSaveFailed(true);
    });
  }, []);

  const value = useMemo(
    () => ({ paletteName, palette, tokens, setPalette, paletteSaveFailed }),
    [paletteName, palette, tokens, setPalette, paletteSaveFailed],
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

