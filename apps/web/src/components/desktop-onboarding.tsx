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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { useState } from "react";

import { desktopSetup } from "@/lib/desktop-auth";
import { toSlug } from "@/lib/slug";

export function DesktopOnboarding({ onComplete }: { onComplete: () => void }) {
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [orgName, setOrgName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugEdited, setSlugEdited] = useState(false);

	function handleOrgNameChange(value: string) {
		setOrgName(value);
		if (!slugEdited) setSlug(toSlug(value) ?? "");
	}

	async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const form = new FormData(e.currentTarget);
		const trimmedOrgName = orgName.trim();
		const finalSlug = slug.trim() || toSlug(trimmedOrgName) || "";
		const name = (form.get("name") as string).trim();
		const email = (form.get("email") as string).trim();
		const password = form.get("password") as string;

		if (!trimmedOrgName || !finalSlug || !name || !email || !password) {
			setError(m.desktop_onboarding_fields_required());
			setLoading(false);
			return;
		}

		try {
			await desktopSetup({ orgName: trimmedOrgName, slug: finalSlug, email, password, name });
			onComplete();
		} catch (err) {
			setError(err instanceof Error ? err.message : m.desktop_onboarding_failed());
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-6">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>{m.desktop_onboarding_heading()}</CardTitle>
					<CardDescription>{m.desktop_onboarding_description()}</CardDescription>
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
								<FieldLabel htmlFor="org-name">{m.label_org_name()}</FieldLabel>
								<Input
									id="org-name"
									name="orgName"
									type="text"
									value={orgName}
									onChange={(e) => handleOrgNameChange(e.currentTarget.value)}
									placeholder={m.label_org_name()}
									required
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="org-slug">{m.label_org_slug()}</FieldLabel>
								<Input
									id="org-slug"
									name="slug"
									type="text"
									value={slug}
									onChange={(e) => {
										setSlug(e.currentTarget.value);
										setSlugEdited(true);
									}}
									placeholder="acme"
									pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
									minLength={2}
									maxLength={48}
									required
									className="font-mono"
								/>
								{slug && (
									<FieldDescription>
										{m.org_slug_url_preview({ slug })}
									</FieldDescription>
								)}
							</Field>
							<Field>
								<FieldLabel htmlFor="name">
									{m.desktop_onboarding_your_name()}
								</FieldLabel>
								<Input
									id="name"
									name="name"
									type="text"
									placeholder={m.desktop_onboarding_your_name()}
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
							{loading
								? m.desktop_onboarding_submitting()
								: m.desktop_onboarding_submit()}
						</Button>
					</CardContent>
				</form>
			</Card>
		</div>
	);
}
