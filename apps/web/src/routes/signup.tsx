import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";

import { signUp } from "@/lib/auth-client";
import { getSession } from "@/lib/auth-session";

export const Route = createFileRoute("/signup")({
	beforeLoad: async () => {
		const session = await getSession();
		if (session) {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: SignupPage,
});

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

		if (err) {
			// if user was added by an admin, claim the account
			if (err.code === "USER_ALREADY_EXISTS" || err.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
				const res = await fetch("/api/auth/claim", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, password }),
				});
				if (res.ok) {
					setLoading(false);
					navigate({ to: "/dashboard", reloadDocument: true });
					return;
				}
				const data = await res.json().catch(() => null);
				setLoading(false);
				setError(data?.message ?? m.signup_failed());
				return;
			}
			setLoading(false);
			setError(err.message ?? m.signup_failed());
			return;
		}

		setLoading(false);
		navigate({ to: "/onboarding" });
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-6">
			<form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
				<h1 className="text-lg font-medium">{m.signup_heading()}</h1>

				{error && <p className="text-destructive text-sm">{error}</p>}

				<div className="flex flex-col gap-1">
					<label htmlFor="name" className="text-sm font-medium">
						{m.label_name()}
					</label>
					<input
						id="name"
						name="name"
						type="text"
						placeholder={m.label_name()}
						required
						className="border-border bg-background h-9 rounded-none border px-3 text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor="email" className="text-sm font-medium">
						{m.label_email()}
					</label>
					<input
						id="email"
						name="email"
						type="email"
						placeholder={m.label_email()}
						required
						className="border-border bg-background h-9 rounded-none border px-3 text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor="password" className="text-sm font-medium">
						{m.label_password()}
					</label>
					<input
						id="password"
						name="password"
						type="password"
						placeholder={m.label_password()}
						required
						minLength={6}
						className="border-border bg-background h-9 rounded-none border px-3 text-sm"
					/>
				</div>

				<Button type="submit" disabled={loading}>
					{loading ? m.signup_submitting() : m.signup_submit()}
				</Button>

				<p className="text-muted-foreground text-sm">
					{m.signup_has_account()}{" "}
					<Link to="/login" className="text-primary underline">
						{m.signup_login_link()}
					</Link>
				</p>
			</form>
		</div>
	);
}
