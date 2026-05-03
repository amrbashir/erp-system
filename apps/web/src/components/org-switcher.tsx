import { useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";

import { isDesktop } from "@/lib/activation";
import { client } from "@/lib/orpc";

const CURRENT_ORG_KEY = "current_org_id";

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

		if (isDesktop()) {
			localStorage.setItem(CURRENT_ORG_KEY, orgId);
			setOpen(false);
			void navigate({ to: "/dashboard", reloadDocument: true });
			return;
		}

		const sw = await client.orgs.switch({ orgId }).catch((e: Error) => e);
		if (sw instanceof Error) {
			setError(sw.message || m.org_switcher_failed());
			return;
		}

		setOpen(false);
		void navigate({ to: "/dashboard", reloadDocument: true });
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
				<div className="border-border bg-background absolute end-0 top-full z-50 mt-1 min-w-48 rounded border shadow-md">
					{error && <p className="text-destructive px-3 py-2 text-sm">{error}</p>}
					{orgs.map((org) => (
						<button
							key={org.id}
							type="button"
							onClick={() => switchOrg(org.id)}
							className={`hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-start text-sm ${
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
								void navigate({ to: "/new-org" });
							}}
							className="hover:bg-muted w-full px-3 py-2 text-start text-sm"
						>
							{m.org_switcher_new()}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
