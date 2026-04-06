export const SUPPORTED_LOCALES = ["en", "ar"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en";

const STORAGE_KEY = "locale";

function isSupportedLocale(locale: string): locale is SupportedLocale {
	return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

export function detectLocale(): SupportedLocale {
	// Check persisted preference first
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored && isSupportedLocale(stored)) return stored;
	} catch {}

	// Check browser locale
	try {
		const languages = navigator.languages?.length
			? navigator.languages
			: [navigator.language];
		for (const lang of languages) {
			const base = lang.split("-")[0].toLowerCase();
			if (isSupportedLocale(base)) return base;
		}
	} catch {}

	return DEFAULT_LOCALE;
}

export function persistLocale(locale: SupportedLocale): void {
	try {
		localStorage.setItem(STORAGE_KEY, locale);
	} catch {}
}
