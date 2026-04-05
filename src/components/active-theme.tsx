'use client';

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
import { DEFAULT_ACTIVE_THEME } from '@/constants/theme';

type ThemeContextType = {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  isLoading: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ActiveThemeProvider({
  children,
  initialTheme
}: {
  children: ReactNode;
  initialTheme?: string;
}) {
  const [activeTheme, setActiveThemeState] = useState<string>(
    () => initialTheme || DEFAULT_ACTIVE_THEME
  );
  const isLoading = false;

  const setActiveTheme = (theme: string) => {
    setActiveThemeState(theme);
  };

  useEffect(() => {
    Array.from(document.body.classList)
      .filter((className) => className.startsWith('theme-'))
      .forEach((className) => {
        document.body.classList.remove(className);
      });
    document.body.classList.add(`theme-${activeTheme}`);
    if (activeTheme.endsWith('-scaled')) {
      document.body.classList.add('theme-scaled');
    } else {
      document.body.classList.remove('theme-scaled');
    }
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeConfig() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error(
      'useThemeConfig must be used within an ActiveThemeProvider'
    );
  }
  return context;
}
