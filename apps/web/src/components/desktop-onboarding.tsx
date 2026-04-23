import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";

import { desktopSetup } from "@/lib/desktop-auth";

export function DesktopOnboarding({ onComplete }: { onComplete: () => void }) {
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const form = new FormData(e.currentTarget);
		const orgName = (form.get("orgName") as string).trim();
		const name = (form.get("name") as string).trim();
		const username = (form.get("username") as string).trim();
		const password = form.get("password") as string;

		if (!orgName || !name || !username || !password) {
			setError(m.desktop_onboarding_fields_required());
			setLoading(false);
			return;
		}

		try {
			await desktopSetup({ orgName, username, password, name });
			onComplete();
		} catch (err: any) {
			setError(err.message ?? m.desktop_onboarding_failed());
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
						placeholder={m.label_org_name()}
						required
						className="border-border bg-background h-9 rounded-none border px-3 text-sm"
					/>
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
					<label htmlFor="username" className="text-sm font-medium">
						{m.label_username()}
					</label>
					<input
						id="username"
						name="username"
						type="text"
						placeholder={m.label_username()}
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
