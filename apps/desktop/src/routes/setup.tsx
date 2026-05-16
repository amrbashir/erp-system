import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { type AnyRoute, createRoute, redirect, useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { setupRunInput } from "@workspace/server/setup/setup.contract";
import { toSlug } from "@workspace/shared/slug";
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
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { useState } from "react";
import * as z from "zod";

import { desktopQueryKeys } from "../gate";
import { IS_DESKTOP } from "../index";
import { desktopSetup } from "../lib/sidecar";

function SetupPage() {
	const qc = useQueryClient();
	const navigate = useNavigate();
	const [error, setError] = useState("");
	const [slugEdited, setSlugEdited] = useState(false);

	// Form always provides a slug; contract optional for non-form callers.
	const setupFormSchema = setupRunInput
		.extend({ slug: z.string(), confirmPassword: z.string() })
		.refine((data) => data.password === data.confirmPassword, {
			message: m.password_mismatch(),
			path: ["confirmPassword"],
		});

	const form = useForm({
		defaultValues: {
			orgName: "",
			slug: "",
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		validators: { onSubmit: setupFormSchema },
		onSubmit: async ({ value: { confirmPassword: _, ...value } }) => {
			setError("");
			const trimmedOrgName = value.orgName.trim();
			const finalSlug = value.slug.trim() || toSlug(trimmedOrgName) || "";
			const name = value.name.trim();
			const email = value.email.trim();

			if (!trimmedOrgName || !finalSlug || !name || !email || !value.password) {
				setError(m.desktop_onboarding_fields_required());
				return;
			}

			try {
				await desktopSetup({
					orgName: trimmedOrgName,
					slug: finalSlug,
					email,
					password: value.password,
					name,
				});
				await qc.invalidateQueries({ queryKey: desktopQueryKeys.all });
				await navigate({ to: "/" });
			} catch (err) {
				setError(err instanceof Error ? err.message : m.desktop_onboarding_failed());
			}
		},
	});

	return (
		<div className="flex min-h-svh items-center justify-center p-6">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>{m.desktop_onboarding_heading()}</CardTitle>
					<CardDescription>{m.desktop_onboarding_description()}</CardDescription>
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
							<form.Field name="orgName">
								{(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>
											{m.label_org_name()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="text"
											placeholder={m.label_org_name()}
											required
											value={field.state.value}
											onChange={(e) => {
												const v = e.currentTarget.value;
												field.handleChange(v);
												if (!slugEdited)
													form.setFieldValue("slug", toSlug(v) ?? "");
											}}
											onBlur={field.handleBlur}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>
							<form.Field name="slug">
								{(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>
											{m.label_org_slug()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="text"
											placeholder="acme"
											pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
											minLength={2}
											maxLength={48}
											required
											className="font-mono"
											value={field.state.value}
											onChange={(e) => {
												field.handleChange(e.currentTarget.value);
												setSlugEdited(true);
											}}
											onBlur={field.handleBlur}
										/>
										{field.state.value && (
											<FieldDescription>
												{m.org_slug_url_preview({
													slug: field.state.value,
												})}
											</FieldDescription>
										)}
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>
							<form.Field name="name">
								{(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>
											{m.desktop_onboarding_your_name()}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="text"
											placeholder={m.desktop_onboarding_your_name()}
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
											placeholder={m.label_email()}
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
												const matches =
													field.state.value.length > 0 &&
													field.state.value === password;
												const mismatches =
													field.state.value.length > 0 &&
													field.state.value !== password;
												if (!matches && !mismatches) return null;
												return (
													<p
														className={cn(
															"flex items-center gap-1 text-xs",
															matches
																? "text-primary"
																: "text-destructive",
														)}
													>
														{matches ? (
															<CheckIcon weight="bold" />
														) : (
															<XIcon weight="bold" />
														)}
														{matches
															? m.password_match()
															: m.password_mismatch()}
													</p>
												);
											}}
										</form.Subscribe>
									</Field>
								)}
							</form.Field>
						</FieldGroup>

						<form.Subscribe selector={(s) => s.isSubmitting}>
							{(isSubmitting) => (
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting
										? m.desktop_onboarding_submitting()
										: m.desktop_onboarding_submit()}
								</Button>
							)}
						</form.Subscribe>
					</CardContent>
				</form>
			</Card>
		</div>
	);
}

export function createSetupRoute(rootRoute: AnyRoute) {
	return createRoute({
		getParentRoute: () => rootRoute,
		path: "/setup",
		beforeLoad: () => {
			if (!IS_DESKTOP) throw redirect({ to: "/" });
		},
		component: SetupPage,
	});
}
