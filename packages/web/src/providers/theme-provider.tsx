import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";

export const THEME_VARIANTS = [
  { theme: "system", icon: MonitorIcon },
  { theme: "dark", icon: MoonIcon },
  { theme: "light", icon: SunIcon },
] as const;

export type Theme = (typeof THEME_VARIANTS)[number]["theme"];
export type ThemeIcon = (typeof THEME_VARIANTS)[number]["icon"];

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export type ThemeProviderState = {
  theme: Theme;
  ThemeIcon: React.ComponentType;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const initialState: ThemeProviderState = {
  theme: THEME_VARIANTS[0].theme,
  ThemeIcon: THEME_VARIANTS[0].icon,
  setTheme: () => null,
  toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );

  const themeIcon = THEME_VARIANTS.find((v) => v.theme === theme)?.icon ?? THEME_VARIANTS[0].icon;

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    const currentThemeIndex = THEME_VARIANTS.findIndex((v) => v.theme === theme);
    const nextThemeIndex = (currentThemeIndex + 1) % THEME_VARIANTS.length;
    const nextTheme = THEME_VARIANTS[nextThemeIndex].theme;
    setTheme(nextTheme);
  };

  const contextValue = {
    theme,
    ThemeIcon: themeIcon,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={contextValue}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
