import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Appearance as NativeAppearance, Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { palettes, type Palette, type PaletteName } from '@/shared/theme/palettes';
import { createThemeTokens, type ThemeTokens } from '@/shared/theme/tokens';

export { palettes } from '@/shared/theme/palettes';
export type { PaletteName } from '@/shared/theme/palettes';

export type Appearance = 'light' | 'dark' | 'system';
type ThemeContextValue = {
  paletteName: PaletteName;
  palette: Palette;
  tokens: ThemeTokens;
  setPalette: (name: PaletteName) => void;
  appearance: Appearance;
  setAppearance: (value: Appearance) => void;
  isDark: boolean;
  appearanceSaveFailed: boolean;
  paletteSaveFailed: boolean;
};

function isPalette(value: string): value is PaletteName {
  return Object.hasOwn(palettes, value);
}

function isAppearance(value: string): value is Appearance {
  return value === 'light' || value === 'dark' || value === 'system';
}

function useStoredPreference<T extends string>(key: string, initial: T, valid: (value: string) => value is T) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const revision = useRef(0);
  const writes = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    void (async () => {
      const stored = Platform.OS === 'web' ? localStorage.getItem(key) : await SecureStore.getItemAsync(key);
      if (active && revision.current === 0 && stored !== null && valid(stored)) setValue(stored);
    })().catch(() => undefined).finally(() => {
      if (active) setReady(true);
    });
    return () => { active = false; };
  }, [key, valid]);

  const change = useCallback((next: T) => {
    const version = ++revision.current;
    setValue(next);
    setSaveFailed(false);
    writes.current = writes.current.then(async () => {
      if (Platform.OS === 'web') localStorage.setItem(key, next);
      else await SecureStore.setItemAsync(key, next);
    }).catch(() => {
      if (version === revision.current) setSaveFailed(true);
    });
  }, [key]);

  return [value, change, saveFailed, ready] as const;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [paletteName, setPalette, paletteSaveFailed, paletteReady] = useStoredPreference<PaletteName>('arthere.palette', 'Arthere', isPalette);
  const [appearance, setAppearance, appearanceSaveFailed, appearanceReady] = useStoredPreference<Appearance>('arthere.appearance', 'light', isAppearance);
  const system = useColorScheme();
  const isDark = appearance === 'dark' || (appearance === 'system' && system === 'dark');
  const palette = palettes[paletteName];
  const tokens = useMemo(() => createThemeTokens(palette, isDark), [palette, isDark]);
  const value = useMemo(() => ({
    paletteName, palette, tokens, setPalette, paletteSaveFailed, appearance, setAppearance, isDark, appearanceSaveFailed,
  }), [paletteName, palette, tokens, setPalette, paletteSaveFailed, appearance, setAppearance, isDark, appearanceSaveFailed]);
  useLayoutEffect(() => {
    if (appearanceReady && (Platform.OS === 'ios' || Platform.OS === 'android')) {
      NativeAppearance.setColorScheme(appearance === 'system' ? 'auto' : appearance);
    }
  }, [appearance, appearanceReady]);

  if (!paletteReady || !appearanceReady) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser utilizado dentro de ThemeProvider.');
  return context;
}
