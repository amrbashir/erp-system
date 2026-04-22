import { useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";

import { toSlug } from "@/lib/slug";

interface CreateOrgFormProps {
	title: string;
	description?: string;
	onCancel?: () => void;
}

export function CreateOrgForm({ title, description, onCancel }: CreateOrgFormProps) {
	const navigate = useNavigate();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const form = new FormData(e.currentTarget);
		const name = (form.get("name") as string).trim();
		const slug = toSlug(name);

		if (!slug) {
			setError(m.create_org_invalid_name());
			setLoading(false);
			return;
		}

		const res = await fetch("/api/orgs", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, slug }),
		});

		if (!res.ok) {
			const data = await res.json().catch(() => null);
			setError(data?.message ?? m.create_org_failed());
			setLoading(false);
			return;
		}

		const org = await res.json();

		const switchRes = await fetch("/api/orgs/switch", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ orgId: org.id }),
		});

		if (!switchRes.ok) {
			const data = await switchRes.json().catch(() => null);
			setError(data?.message ?? m.switch_org_failed());
			setLoading(false);
			return;
		}

		setLoading(false);
		navigate({ to: "/dashboard", reloadDocument: true });
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-6">
			<form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
				<h1 className="text-lg font-medium">{title}</h1>
				{description && <p className="text-muted-foreground text-sm">{description}</p>}

				{error && <p className="text-destructive text-sm">{error}</p>}

				<div className="flex flex-col gap-1">
					<label htmlFor="org-name" className="text-sm font-medium">
						{m.label_org_name()}
					</label>
					<input
						id="org-name"
						name="name"
						type="text"
						placeholder={m.label_org_name()}
						required
						className="border-border bg-background h-9 rounded-none border px-3 text-sm"
					/>
				</div>

				<Button type="submit" disabled={loading}>
					{loading ? m.create_org_submitting() : m.create_org_submit()}
				</Button>

				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="text-muted-foreground text-sm underline"
					>
						{m.cancel()}
					</button>
				)}
			</form>
		</div>
	);
}
