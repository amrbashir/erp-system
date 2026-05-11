import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { toSlug } from "@workspace/shared/slug";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { useState } from "react";

import { orpc } from "@/lib/orpc";

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

		void navigate({
			to: "/org/$orgSlug",
			params: { orgSlug: org.slug },
			reloadDocument: true,
		});
	}

	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
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
									name="name"
									type="text"
									value={name}
									onChange={(e) => handleNameChange(e.currentTarget.value)}
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
						</FieldGroup>

						<Button type="submit" disabled={createMutation.isPending}>
							{createMutation.isPending ? m.create_org_submitting() : m.create_org_submit()}
						</Button>
					</CardContent>
					{onCancel && (
						<CardFooter className="justify-center">
							<Button type="button" variant="link" size="sm" onClick={onCancel}>
								{m.cancel()}
							</Button>
						</CardFooter>
					)}
				</form>
			</Card>
		</div>
	);
}
