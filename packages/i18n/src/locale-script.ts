import { baseLocale, locales, localStorageKey } from "./paraglide/runtime";

const rtlLocales = locales.filter((l) => {
	try {
		const info = new Intl.Locale(l) as Intl.Locale & {
			getTextInfo?: () => { direction?: string };
			textInfo?: { direction?: string };
		};
		const dir = info.getTextInfo?.().direction ?? info.textInfo?.direction;
		return dir === "rtl";
	} catch {
		return false;
	}
});

/**
 * Inline <script> body to apply lang/dir from localStorage before paint.
 * SSR renders <html> with baseLocale (no localStorage); without this the user's
 * saved locale would never flip <html dir>. Render via dangerouslySetInnerHTML.
 */
export const localeScript = `(function(){var L=${JSON.stringify(locales)};var R=${JSON.stringify(rtlLocales)};var l=localStorage.getItem(${JSON.stringify(localStorageKey)});if(!l){var n=(navigator.language||"${baseLocale}").split("-")[0];l=L.indexOf(n)>=0?n:"${baseLocale}"}var h=document.documentElement;h.lang=l;h.dir=R.indexOf(l)>=0?"rtl":"ltr"})()`;
