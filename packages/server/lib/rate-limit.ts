import { getRequestIP } from "h3";
import type { H3Event } from "h3";

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

export function createRateLimiter(opts: { window: number; max: number }) {
	const store = new Map<string, RateLimitEntry>();

	// periodic cleanup to prevent memory leak
	setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of store) {
			if (now >= entry.resetAt) store.delete(key);
		}
	}, opts.window * 2).unref();

	return function check(event: H3Event): boolean {
		const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
		const now = Date.now();
		const entry = store.get(ip);

		if (!entry || now >= entry.resetAt) {
			store.set(ip, { count: 1, resetAt: now + opts.window });
			return true;
		}

		entry.count++;
		if (entry.count > opts.max) {
			return false;
		}
		return true;
	};
}
