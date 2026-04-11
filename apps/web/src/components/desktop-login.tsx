import { Button } from "@workspace/ui/components/button";
import { useState } from "react";

import { desktopLogin } from "@/lib/desktop-auth";

export function DesktopLogin({ onLoggedIn }: { onLoggedIn: () => void }) {
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const form = new FormData(e.currentTarget);
		const username = (form.get("username") as string).trim();
		const password = form.get("password") as string;

		try {
			await desktopLogin({ username, password });
			onLoggedIn();
		} catch (err: any) {
			setError(err.message ?? "Login failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-6">
			<form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
				<h1 className="text-lg font-medium">Log in</h1>

				{error && <p className="text-destructive text-sm">{error}</p>}

				<input
					name="username"
					type="text"
					placeholder="Username"
					required
					className="border-border bg-background h-9 rounded-none border px-3 text-sm"
				/>
				<input
					name="password"
					type="password"
					placeholder="Password"
					required
					className="border-border bg-background h-9 rounded-none border px-3 text-sm"
				/>

				<Button type="submit" disabled={loading}>
					{loading ? "Logging in…" : "Log in"}
				</Button>
			</form>
		</div>
	);
}
