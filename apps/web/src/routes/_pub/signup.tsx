import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { IS_DESKTOP } from "@workspace/desktop";
import { m } from "@workspace/i18n";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { useState } from "react";
import * as z from "zod";

import { signUp } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";
import { safeRedirect } from "@/lib/safe-redirect";

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

	const signupSchema = z
		.object({
			name: z.string().min(1),
			email: z.email(),
			password: z.string().min(6),
			confirmPassword: z.string(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: m.password_mismatch(),
			path: ["confirmPassword"],
		});

	const form = useForm({
		defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
		validators: { onSubmit: signupSchema },
		onSubmit: async ({ value: { confirmPassword: _, ...credentials } }) => {
			setError("");
			const { error: err } = await signUp.email(credentials);
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
			<div className="flex w-full max-w-sm flex-col gap-6">
				<Card>
					<CardHeader className="text-center">
						<CardTitle className="text-xl">{m.signup_welcome()}</CardTitle>
						{!IS_DESKTOP && (
							<CardDescription>{m.signup_google_description()}</CardDescription>
						)}
					</CardHeader>
					<CardContent>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								void form.handleSubmit();
							}}
						>
							<FieldGroup>
								{error && (
									<Alert variant="destructive">
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								)}
								{!IS_DESKTOP && (
									<>
										<Field>
											{/* TODO: enable Google OAuth */}
											<Button variant="outline" type="button" disabled>
												<GoogleIcon data-icon="inline-start" />
												{m.signup_with_google()}
											</Button>
										</Field>
										<FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
											{m.auth_or_continue()}
										</FieldSeparator>
									</>
								)}
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
								<form.Field name="confirmPassword">
									{(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>
												{m.label_password_confirm()}
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												type="password"
												placeholder={m.placeholder_password_confirm()}
												required
												value={field.state.value}
												onChange={(e) =>
													field.handleChange(e.currentTarget.value)
												}
												onBlur={field.handleBlur}
											/>
											<form.Subscribe
												selector={(s) => ({
													password: s.values.password,
													attempted: s.submissionAttempts > 0,
												})}
											>
												{({ password, attempted }) => {
													if (!attempted) return null;
													if (field.state.value.length === 0) return null;
													if (field.state.value === password) {
														return (
															<FieldDescription className="text-primary flex items-center gap-1">
																<CheckIcon weight="bold" />
																{m.password_match()}
															</FieldDescription>
														);
													}
													return (
														<FieldError>
															<span className="inline-flex items-center gap-1">
																<XIcon weight="bold" />
																{m.password_mismatch()}
															</span>
														</FieldError>
													);
												}}
											</form.Subscribe>
										</Field>
									)}
								</form.Field>
								<Field>
									{/* TODO: enable email/password sign-up */}
									<Button type="submit" disabled>
										{m.signup_submit()}
									</Button>
									<FieldDescription className="text-center">
										{m.signup_has_account()}{" "}
										<Link
											to="/login"
											search={
												redirectTo ? { redirect: redirectTo } : undefined
											}
											className="underline-offset-4 hover:underline"
										>
											{m.signup_signin_link()}
										</Link>
									</FieldDescription>
								</Field>
							</FieldGroup>
						</form>
					</CardContent>
				</Card>
				{/* TODO: link to Terms of Service and Privacy Policy pages */}
				<FieldDescription className="px-6 text-center">
					{m.auth_terms_prefix()}{" "}
					<a href="#" className="underline underline-offset-4">
						{m.auth_terms_link()}
					</a>{" "}
					{m.auth_terms_and()}{" "}
					<a href="#" className="underline underline-offset-4">
						{m.auth_privacy_link()}
					</a>
					.
				</FieldDescription>
			</div>
		</div>
	);
}

function GoogleIcon(props: React.ComponentProps<"svg">) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 262" {...props}>
			<path
				fill="#4285f4"
				d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
			/>
			<path
				fill="#34a853"
				d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
			/>
			<path
				fill="#fbbc05"
				d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
			/>
			<path
				fill="#eb4335"
				d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
			/>
		</svg>
	);
}
