import { useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

function getSystemTheme(): "light" | "dark" {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme {
	if (typeof window === "undefined") return "system";
	return (localStorage.getItem(STORAGE_KEY) as Theme) ?? "system";
}

function applyTheme(theme: Theme) {
	const resolved = theme === "system" ? getSystemTheme() : theme;
	document.documentElement.classList.toggle("dark", resolved === "dark");
}

let listeners: Array<() => void> = [];
function emit() {
	for (const fn of listeners) fn();
}

function subscribe(fn: () => void) {
	listeners.push(fn);
	return () => {
		listeners = listeners.filter((l) => l !== fn);
	};
}

export function setTheme(theme: Theme) {
	localStorage.setItem(STORAGE_KEY, theme);
	applyTheme(theme);
	emit();
}

export function useTheme() {
	const theme = useSyncExternalStore(subscribe, getStoredTheme, () => "system" as Theme);

	// apply on mount + listen for system preference changes
	useEffect(() => {
		applyTheme(theme);
		if (theme !== "system") return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyTheme("system");
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [theme]);

	return { theme, setTheme };
}
