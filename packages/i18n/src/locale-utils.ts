import { type locales as Locales } from "./paraglide/runtime";

type Locale = (typeof Locales)[number];

/** Endonym display names for each supported locale */
export const localeNames: Record<Locale, string> = {
	en: "English",
	ar: "العربية",
};

/** Given the current locale and list of available locales, return the next locale to switch to */
export function getNextLocale(current: Locale, available: readonly Locale[]): Locale {
	const idx = available.indexOf(current);
	return available[(idx + 1) % available.length];
}
