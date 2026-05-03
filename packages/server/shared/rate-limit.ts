interface RateLimitEntry {
	count: number;
	resetAt: number;
}

/**
 * In-memory IP-based limiter. Accepts a `Request` so the same factory
 * works for h3 event-based handlers and oRPC procedures (which only
 * see the parsed `Request`).
 */
export function createRateLimiter(opts: { window: number; max: number }) {
	const store = new Map<string, RateLimitEntry>();

	// periodic cleanup to prevent memory leak
	setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of store) {
			if (now >= entry.resetAt) store.delete(key);
		}
	}, opts.window * 2).unref();

	return function check(request: Request): boolean {
		const ip = clientIp(request);
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

function clientIp(request: Request): string {
	const xff = request.headers.get("x-forwarded-for");
	if (xff) {
		const first = xff.split(",")[0]?.trim();
		if (first) return first;
	}
	const real = request.headers.get("x-real-ip");
	if (real) return real;
	return "unknown";
}
