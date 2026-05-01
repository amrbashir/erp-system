import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

interface ThemeProviderProps {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
}

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "theme",
}: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window === "undefined") return defaultTheme;
		return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
	});

	// Apply class + listen for OS preference changes when "system".
	useEffect(() => {
		const root = document.documentElement;
		const apply = () => {
			const resolved =
				theme === "system"
					? window.matchMedia("(prefers-color-scheme: dark)").matches
						? "dark"
						: "light"
					: theme;
			root.classList.toggle("dark", resolved === "dark");
		};
		apply();
		if (theme !== "system") return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		mq.addEventListener("change", apply);
		return () => mq.removeEventListener("change", apply);
	}, [theme]);

	const value: ThemeProviderState = {
		theme,
		setTheme: (next) => {
			localStorage.setItem(storageKey, next);
			setThemeState(next);
		},
	};

	return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

export function useTheme() {
	const ctx = useContext(ThemeProviderContext);
	if (ctx === initialState) {
		throw new Error("useTheme must be used within a <ThemeProvider>");
	}
	return ctx;
}
