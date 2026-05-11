import { useForm } from "@tanstack/react-form";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { useState } from "react";
import * as z from "zod";

import { AppHeader } from "@/components/app-header";
import { signIn } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";
import { safeRedirect } from "@/lib/safe-redirect";

const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
});

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
	beforeLoad: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData(orpc.session.get.queryOptions());
		if (session) throw redirect({ to: "/home" });
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const { redirect: redirectTo } = Route.useSearch();
	const [error, setError] = useState("");

	const form = useForm({
		defaultValues: { email: "", password: "" },
		validators: { onSubmit: loginSchema },
		onSubmit: async ({ value }) => {
			setError("");
			const { error: err } = await signIn.email(value);
			if (err) {
				setError(err.message ?? m.signin_failed());
				return;
			}
			// reloadDocument refetches - without it, `_authed`'s beforeLoad sees the cached null session and bounces back.
			const dest = safeRedirect(redirectTo);
			void navigate({ to: dest, reloadDocument: true });
		},
	});

	return (
		<div className="flex min-h-svh flex-col">
			<AppHeader />
			<div className="flex flex-1 items-center justify-center p-6">
				<Card className="w-full max-w-sm">
					<CardHeader>
						<CardTitle>{m.signin_heading()}</CardTitle>
					</CardHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							void form.handleSubmit();
						}}
					>
						<CardContent className="flex flex-col gap-4">
							{error && (
								<Alert variant="destructive">
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<FieldGroup>
								<form.Field name="email">
									{(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>
												{m.label_email()}
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												type="email"
												placeholder={m.label_email()}
												required
												value={field.state.value}
												onChange={(e) => field.handleChange(e.currentTarget.value)}
												onBlur={field.handleBlur}
											/>
											<FieldError errors={field.state.meta.errors} />
										</Field>
									)}
								</form.Field>
								<form.Field name="password">
									{(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>
												{m.label_password()}
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												type="password"
												placeholder={m.label_password()}
												required
												value={field.state.value}
												onChange={(e) => field.handleChange(e.currentTarget.value)}
												onBlur={field.handleBlur}
											/>
											<FieldError errors={field.state.meta.errors} />
										</Field>
									)}
								</form.Field>
							</FieldGroup>

							<form.Subscribe selector={(s) => s.isSubmitting}>
								{(isSubmitting) => (
									<Button type="submit" disabled={isSubmitting}>
										{isSubmitting ? m.signin_submitting() : m.signin_submit()}
									</Button>
								)}
							</form.Subscribe>
						</CardContent>
					</form>
					<CardFooter className="justify-center">
						<span className="text-muted-foreground">{m.signin_no_account()}</span>
						<Button
							variant="link"
							size="sm"
							render={
								<Link
									to="/signup"
									search={redirectTo ? { redirect: redirectTo } : undefined}
								/>
							}
							nativeButton={false}
						>
							{m.signin_signup_link()}
						</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
