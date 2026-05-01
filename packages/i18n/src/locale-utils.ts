import { type locales as Locales } from "./paraglide/runtime";

type Locale = (typeof Locales)[number];

/** Given the current locale and list of available locales, return the next locale to switch to */
export function getNextLocale(current: Locale, available: readonly Locale[]): Locale {
	const idx = available.indexOf(current);
	return available[(idx + 1) % available.length];
}
