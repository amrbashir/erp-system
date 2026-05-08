import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { useState } from "react";

import { AppHeader } from "@/components/app-header";
import { signUp } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";
import { safeRedirect } from "@/lib/safe-redirect";

export const Route = createFileRoute("/signup")({
	validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
		redirect: (search.redirect as string) || undefined,
	}),
	beforeLoad: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData(orpc.session.get.queryOptions());
		if (session) throw redirect({ to: "/" });
	},
	component: SignupPage,
});

function SignupPage() {
	const navigate = useNavigate();
	const { redirect: redirectTo } = Route.useSearch();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const form = new FormData(e.currentTarget);
		const name = form.get("name") as string;
		const email = form.get("email") as string;
		const password = form.get("password") as string;

		const { error: err } = await signUp.email({ name, email, password });

		setLoading(false);

		if (err) {
			setError(err.message ?? m.signup_failed());
			return;
		}

		// invitations table is consumed in user.create.after; if the email had
		// pending invites, the user already has org memberships. otherwise,
		// _authed will bounce to /onboarding.
		const dest = safeRedirect(redirectTo);
		void navigate({ to: dest, reloadDocument: true });
	}

	return (
		<div className="flex min-h-svh flex-col">
			<AppHeader />
			<div className="flex flex-1 items-center justify-center p-6">
				<Card className="w-full max-w-sm">
					<CardHeader>
						<CardTitle>{m.signup_heading()}</CardTitle>
					</CardHeader>
					<form onSubmit={handleSubmit}>
						<CardContent className="flex flex-col gap-4">
							{error && (
								<Alert variant="destructive">
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="name">{m.label_name()}</FieldLabel>
									<Input
										id="name"
										name="name"
										type="text"
										placeholder={m.label_name()}
										required
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="email">{m.label_email()}</FieldLabel>
									<Input
										id="email"
										name="email"
										type="email"
										placeholder={m.label_email()}
										required
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="password">{m.label_password()}</FieldLabel>
									<Input
										id="password"
										name="password"
										type="password"
										placeholder={m.label_password()}
										required
										minLength={6}
									/>
								</Field>
							</FieldGroup>

							<Button type="submit" disabled={loading}>
								{loading ? m.signup_submitting() : m.signup_submit()}
							</Button>
						</CardContent>
					</form>
					<CardFooter className="justify-center">
						<span className="text-muted-foreground">{m.signup_has_account()}</span>
						<Button
							variant="link"
							size="sm"
							render={
								<Link
									to="/login"
									search={redirectTo ? { redirect: redirectTo } : undefined}
								/>
							}
							nativeButton={false}
						>
							{m.signup_login_link()}
						</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
