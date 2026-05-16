import { AsyncLocalStorage } from "node:async_hooks";

import {
	extractLocaleFromRequest,
	overwriteServerAsyncLocalStorage,
	type Locale,
} from "@workspace/i18n/paraglide/runtime";
import { definePlugin } from "nitro";

type Store = { locale?: Locale; origin?: string; messageCalls?: Set<string> };

const als = new AsyncLocalStorage<Store>();

// Paraglide's getLocale() reads from this store on the server; without it, SSR
// always returns baseLocale and we get a flash of English before client hydrates
// to the cookie locale.
overwriteServerAsyncLocalStorage(als);

export default definePlugin((nitroApp) => {
	nitroApp.hooks.hook("request", (event) => {
		const locale = extractLocaleFromRequest(event.req);
		const origin = new URL(event.req.url).origin;
		als.enterWith({ locale, origin, messageCalls: new Set() });
	});
});
