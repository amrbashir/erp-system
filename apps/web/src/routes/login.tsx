import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";

import { signIn } from "../lib/auth-client";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
	const navigate = useNavigate();
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

		navigate({ to: "/" });
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-6">
			<form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
				<h1 className="text-lg font-medium">Log in</h1>

				{error && <p className="text-destructive text-sm">{error}</p>}

				<input
					name="email"
					type="email"
					placeholder="Email"
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
