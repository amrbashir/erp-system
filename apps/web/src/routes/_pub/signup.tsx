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

import { signUp } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";
import { safeRedirect } from "@/lib/safe-redirect";

const signupSchema = z.object({
	name: z.string().min(1),
	email: z.email(),
	password: z.string().min(6),
});

export const Route = createFileRoute("/_pub/signup")({
	validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
	beforeLoad: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData(orpc.session.get.queryOptions());
		if (session) throw redirect({ to: "/home" });
	},
	component: SignupPage,
});

function SignupPage() {
	const navigate = useNavigate();
	const { redirect: redirectTo } = Route.useSearch();
	const [error, setError] = useState("");

	const form = useForm({
		defaultValues: { name: "", email: "", password: "" },
		validators: { onSubmit: signupSchema },
		onSubmit: async ({ value }) => {
			setError("");
			const { error: err } = await signUp.email(value);
			if (err) {
				setError(err.message ?? m.signup_failed());
				return;
			}
			// Pending invites consumed in user.create.after - _authed bounces to /onboarding if no memberships.
			const dest = safeRedirect(redirectTo);
			void navigate({ to: dest, reloadDocument: true });
		},
	});

	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>{m.signup_heading()}</CardTitle>
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
							<form.Field name="name">
								{(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>
											{m.label_name()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="text"
											placeholder={m.placeholder_name()}
											required
											value={field.state.value}
											onChange={(e) =>
												field.handleChange(e.currentTarget.value)
											}
											onBlur={field.handleBlur}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>
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
											placeholder={m.placeholder_email()}
											required
											value={field.state.value}
											onChange={(e) =>
												field.handleChange(e.currentTarget.value)
											}
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
											placeholder={m.placeholder_password_signup()}
											required
											minLength={6}
											value={field.state.value}
											onChange={(e) =>
												field.handleChange(e.currentTarget.value)
											}
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
									{isSubmitting ? m.signup_submitting() : m.signup_submit()}
								</Button>
							)}
						</form.Subscribe>
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
						{m.signup_signin_link()}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
