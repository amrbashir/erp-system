import { useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";

type Org = {
	id: string;
	name: string;
	slug: string;
	role: string;
};

export function OrgSwitcher({ orgs, currentOrgId }: { orgs: Org[]; currentOrgId: string | null }) {
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const [error, setError] = useState("");
	const currentOrg = orgs.find((o) => o.id === currentOrgId) ?? orgs[0];

	async function switchOrg(orgId: string) {
		setError("");

		const res = await fetch("/api/orgs/switch", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ orgId }),
		});

		if (!res.ok) {
			const data = await res.json().catch(() => null);
			setError(data?.message ?? m.org_switcher_failed());
			return;
		}

		setOpen(false);
		navigate({ to: "/dashboard", reloadDocument: true });
	}

	if (orgs.length === 0) return null;

	return (
		<div className="relative">
			<Button
				variant="ghost"
				size="sm"
				onClick={() => setOpen(!open)}
				className="max-w-48 truncate"
			>
				{currentOrg?.name ?? m.org_switcher_select()}
			</Button>

			{open && (
				<div className="border-border bg-background absolute top-full right-0 z-50 mt-1 min-w-48 rounded border shadow-md">
					{error && <p className="text-destructive px-3 py-2 text-sm">{error}</p>}
					{orgs.map((org) => (
						<button
							key={org.id}
							type="button"
							onClick={() => switchOrg(org.id)}
							className={`hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
								org.id === currentOrgId ? "bg-muted" : ""
							}`}
						>
							<span className="truncate">{org.name}</span>
							<span className="text-muted-foreground text-xs">{org.role}</span>
						</button>
					))}
					<div className="border-border border-t">
						<button
							type="button"
							onClick={() => {
								setOpen(false);
								navigate({ to: "/new-org" });
							}}
							className="hover:bg-muted w-full px-3 py-2 text-left text-sm"
						>
							{m.org_switcher_new()}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
