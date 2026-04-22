import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";

import { signIn } from "@/lib/auth-client";
import { getSession } from "@/lib/auth-session";
import { safeRedirect } from "@/lib/safe-redirect";

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
		redirect: (search.redirect as string) || undefined,
	}),
	beforeLoad: async () => {
		const session = await getSession();
		if (session) {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const { redirect: redirectTo } = Route.useSearch();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const form = new FormData(e.currentTarget);
		const email = form.get("email") as string;
		const password = form.get("password") as string;

		const { error: err } = await signIn.email({
			email,
			password,
		});

		setLoading(false);

		if (err) {
			setError(err.message ?? "Login failed");
			return;
		}

		const dest = safeRedirect(redirectTo);
		navigate({ to: dest });
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-6">
			<form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
				<h1 className="text-lg font-medium">Log in</h1>

				{error && <p className="text-destructive text-sm">{error}</p>}

				<div className="flex flex-col gap-1">
					<label htmlFor="email" className="text-sm font-medium">
						Email
					</label>
					<input
						id="email"
						name="email"
						type="email"
						placeholder="Email"
						required
						className="border-border bg-background h-9 rounded-none border px-3 text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor="password" className="text-sm font-medium">
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						placeholder="Password"
						required
						className="border-border bg-background h-9 rounded-none border px-3 text-sm"
					/>
				</div>

				<Button type="submit" disabled={loading}>
					{loading ? "Logging in…" : "Log in"}
				</Button>

				<p className="text-muted-foreground text-sm">
					Don&apos;t have an account?{" "}
					<Link to="/signup" className="text-primary underline">
						Sign up
					</Link>
				</p>
			</form>
		</div>
	);
}
