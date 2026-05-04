import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
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
			<form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
				<h1 className="text-lg font-medium">{m.desktop_onboarding_heading()}</h1>
				<p className="text-muted-foreground text-sm">
					{m.desktop_onboarding_description()}
				</p>

				{error && <p className="text-destructive text-sm">{error}</p>}

				<div className="flex flex-col gap-1">
					<label htmlFor="org-name" className="text-sm font-medium">
						{m.label_org_name()}
					</label>
					<input
						id="org-name"
						name="orgName"
						type="text"
						value={orgName}
						onChange={(e) => handleOrgNameChange(e.currentTarget.value)}
						placeholder={m.label_org_name()}
						required
						className="border-border bg-background h-9 rounded-none border px-3 text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor="org-slug" className="text-sm font-medium">
						{m.label_org_slug()}
					</label>
					<input
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
						className="border-border bg-background h-9 rounded-none border px-3 font-mono text-sm"
					/>
					{slug && (
						<p className="text-muted-foreground text-xs">
							{m.org_slug_url_preview({ slug })}
						</p>
					)}
				</div>
				<div className="flex flex-col gap-1">
					<label htmlFor="name" className="text-sm font-medium">
						{m.desktop_onboarding_your_name()}
					</label>
					<input
						id="name"
						name="name"
						type="text"
						placeholder={m.desktop_onboarding_your_name()}
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
					{loading ? m.desktop_onboarding_submitting() : m.desktop_onboarding_submit()}
				</Button>
			</form>
		</div>
	);
}
