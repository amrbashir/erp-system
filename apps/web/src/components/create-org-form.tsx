import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";

import { isDesktop } from "@/lib/activation";
import { orpc } from "@/lib/orpc";
import { toSlug } from "@/lib/slug";

const CURRENT_ORG_KEY = "current_org_id";

interface CreateOrgFormProps {
	title: string;
	description?: string;
	onCancel?: () => void;
}

export function CreateOrgForm({ title, description, onCancel }: CreateOrgFormProps) {
	const navigate = useNavigate();
	const [error, setError] = useState("");
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugEdited, setSlugEdited] = useState(false);
	const createMutation = useMutation(orpc.orgs.create.mutationOptions());
	const switchMutation = useMutation(orpc.orgs.switch.mutationOptions());
	const submitting = createMutation.isPending || switchMutation.isPending;

	function handleNameChange(value: string) {
		setName(value);
		if (!slugEdited) setSlug(toSlug(value) ?? "");
	}

	async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");

		const trimmedName = name.trim();
		const finalSlug = slug.trim() || toSlug(trimmedName) || "";

		if (!finalSlug) {
			setError(m.create_org_invalid_name());
			return;
		}

		let org;
		try {
			org = await createMutation.mutateAsync({ name: trimmedName, slug: finalSlug });
		} catch (err) {
			setError(err instanceof Error ? err.message : m.create_org_failed());
			return;
		}

		if (isDesktop()) {
			localStorage.setItem(CURRENT_ORG_KEY, org.id);
		} else {
			try {
				await switchMutation.mutateAsync({ orgId: org.id });
			} catch (err) {
				setError(err instanceof Error ? err.message : m.switch_org_failed());
				return;
			}
		}

		void navigate({ to: "/dashboard", reloadDocument: true });
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
						value={name}
						onChange={(e) => handleNameChange(e.currentTarget.value)}
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

				<Button type="submit" disabled={submitting}>
					{submitting ? m.create_org_submitting() : m.create_org_submit()}
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
