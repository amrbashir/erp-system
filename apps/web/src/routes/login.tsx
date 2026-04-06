import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";

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
		const { error } = await signIn.email({
			email: form.get("email") as string,
			password: form.get("password") as string,
		});

		setLoading(false);
		if (error) {
			setError(error.message ?? "Invalid credentials");
			return;
		}
		navigate({ to: "/" });
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-6">
			<div className="w-full max-w-sm space-y-6">
				<h1 className="text-xl font-medium">Log in</h1>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="email" className="text-sm font-medium">
							Email
						</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							className="border-input bg-background w-full rounded border px-3 py-2 text-sm"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="password" className="text-sm font-medium">
							Password
						</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							className="border-input bg-background w-full rounded border px-3 py-2 text-sm"
						/>
					</div>

					{error && <p className="text-destructive text-sm">{error}</p>}

					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Logging in..." : "Log in"}
					</Button>
				</form>

				<p className="text-muted-foreground text-center text-sm">
					Don&apos;t have an account?{" "}
					<Link to="/signup" className="text-primary underline">
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}
