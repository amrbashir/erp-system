import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";

export const Route = createFileRoute("/_authed/new-org")({
	component: NewOrgPage,
});

function NewOrgPage() {
	const navigate = useNavigate();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	function toSlug(name: string) {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const form = new FormData(e.currentTarget);
		const name = (form.get("name") as string).trim();
		const slug = toSlug(name);

		if (!slug) {
			setError("Invalid org name");
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
			setError(data?.message ?? "Failed to create organization");
			setLoading(false);
			return;
		}

		const org = await res.json();

		await fetch("/api/orgs/switch", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ orgId: org.id }),
		});

		setLoading(false);
		navigate({ to: "/dashboard" });
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-6">
			<form
				onSubmit={handleSubmit}
				className="flex w-full max-w-sm flex-col gap-4"
			>
				<h1 className="text-lg font-medium">New organization</h1>

				{error && <p className="text-destructive text-sm">{error}</p>}

				<input
					name="name"
					type="text"
					placeholder="Organization name"
					required
					className="border-border bg-background h-9 rounded-none border px-3 text-sm"
				/>

				<Button type="submit" disabled={loading}>
					{loading ? "Creating…" : "Create organization"}
				</Button>

				<button
					type="button"
					onClick={() => navigate({ to: "/dashboard" })}
					className="text-muted-foreground text-sm underline"
				>
					Cancel
				</button>
			</form>
		</div>
	);
}
