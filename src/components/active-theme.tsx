'use client';

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
import { useSession } from 'next-auth/react';

const DEFAULT_THEME = 'match-trader';

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
  const { data: session } = useSession();
  const [activeTheme, setActiveThemeState] = useState<string>(
    () => initialTheme || DEFAULT_THEME
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load global theme settings from database
  useEffect(() => {
    const loadGlobalTheme = async () => {
      try {
        const response = await fetch('/api/global-theme-settings');
        if (response.ok) {
          const data = await response.json();
          setActiveThemeState(data.themeColor || DEFAULT_THEME);
        } else {
          // Fallback to initial theme or default
          setActiveThemeState(initialTheme || DEFAULT_THEME);
        }
      } catch {
        // Fallback to initial theme or default
        setActiveThemeState(initialTheme || DEFAULT_THEME);
      }
      setIsLoading(false);
    };

    loadGlobalTheme();
  }, [initialTheme]); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  const setActiveTheme = async (theme: string) => {
    setActiveThemeState(theme);

    // Only super-admins can change global theme settings
    if (session?.user?.role === 'SUPERADMIN') {
      try {
        await fetch('/api/super-admin/global-theme-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ themeColor: theme })
        });
      } catch {
        // Failed to save - theme stays in local state
      }
    }
    // For non-super-admin users, theme change is temporary (reverts on refresh)
  };

  useEffect(() => {
    if (isLoading) return;

    Array.from(document.body.classList)
      .filter((className) => className.startsWith('theme-'))
      .forEach((className) => {
        document.body.classList.remove(className);
      });
    document.body.classList.add(`theme-${activeTheme}`);
    if (activeTheme.endsWith('-scaled')) {
      document.body.classList.add('theme-scaled');
    }
  }, [activeTheme, isLoading]);

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
