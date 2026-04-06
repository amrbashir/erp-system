import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";
import { signUp } from "../lib/auth-client";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
	const navigate = useNavigate();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const form = new FormData(e.currentTarget);
		const name = form.get("name") as string;
		const email = form.get("email") as string;
		const password = form.get("password") as string;

		const { error: err } = await signUp.email({
			name,
			email,
			password,
		});

		setLoading(false);

		if (err) {
			setError(err.message ?? "Signup failed");
			return;
		}

		navigate({ to: "/" });
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-6">
			<form
				onSubmit={handleSubmit}
				className="flex w-full max-w-sm flex-col gap-4"
			>
				<h1 className="text-lg font-medium">Sign up</h1>

				{error && (
					<p className="text-destructive text-sm">{error}</p>
				)}

				<input
					name="name"
					type="text"
					placeholder="Name"
					required
					className="border-border bg-background h-9 rounded-none border px-3 text-sm"
				/>
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
					minLength={8}
					className="border-border bg-background h-9 rounded-none border px-3 text-sm"
				/>

				<Button type="submit" disabled={loading}>
					{loading ? "Signing up…" : "Sign up"}
				</Button>

				<p className="text-muted-foreground text-sm">
					Already have an account?{" "}
					<a href="/login" className="text-primary underline">
						Log in
					</a>
				</p>
			</form>
		</div>
	);
}
