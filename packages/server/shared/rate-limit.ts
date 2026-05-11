interface RateLimitEntry {
	count: number;
	resetAt: number;
}

/** In-memory IP-based limiter. Takes `Request` so it works for h3 handlers and oRPC procedures. */
export function createRateLimiter(opts: { window: number; max: number }) {
	const store = new Map<string, RateLimitEntry>();

	const timerId = setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of store) {
			if (now >= entry.resetAt) store.delete(key);
		}
	}, opts.window * 2);
	// Deno's setInterval returns a number (use Deno.unrefTimer); Node's returns Timeout (has .unref()).
	const deno = (globalThis as { Deno?: { unrefTimer(id: number): void } }).Deno;
	if (deno) deno.unrefTimer(timerId as unknown as number);
	else (timerId as unknown as { unref(): void }).unref();

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
