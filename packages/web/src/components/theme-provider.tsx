import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

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
};

const initialState: ThemeProviderState = {
  theme: THEME_VARIANTS[0].theme,
  ThemeIcon: THEME_VARIANTS[0].icon,
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );

  const themeIcon = useMemo(
    () => THEME_VARIANTS.find((v) => v.theme === theme)?.icon ?? THEME_VARIANTS[0].icon,
    [theme],
  );

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

  const contextValue = {
    theme,
    ThemeIcon: themeIcon,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
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
