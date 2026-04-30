/** Read `{message}` from a JSON error response, falling back if parse fails. */
export async function readErrorMessage(res: Response, fallback: string): Promise<string> {
	const data = await res.json().catch((e: Error) => e);
	if (data instanceof Error) return fallback;
	return (data as { message?: string })?.message ?? fallback;
}
