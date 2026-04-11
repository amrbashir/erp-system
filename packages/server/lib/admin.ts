export function assertAdmin(session: { user: { role?: string } } | null) {
	if (!session) {
		throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
	}
	if (session.user.role !== "admin") {
		throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
	}
	return session;
}
