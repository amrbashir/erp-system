import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useState } from "react";

import { isDesktop } from "@/lib/activation";
import { orpc } from "@/lib/orpc";

const CURRENT_ORG_KEY = "current_org_id";

type Org = {
	id: string;
	name: string;
	slug: string;
	role: string;
};

export function OrgSwitcher({ orgs, currentOrgId }: { orgs: Org[]; currentOrgId: string | null }) {
	const navigate = useNavigate();
	const [error, setError] = useState("");
	const switchMutation = useMutation(orpc.orgs.switch.mutationOptions());
	const currentOrg = orgs.find((o) => o.id === currentOrgId) ?? orgs[0];

	async function switchOrg(orgId: string) {
		setError("");

		if (isDesktop()) {
			localStorage.setItem(CURRENT_ORG_KEY, orgId);
			void navigate({ to: "/dashboard", reloadDocument: true });
			return;
		}

		try {
			await switchMutation.mutateAsync({ orgId });
		} catch (e) {
			setError(e instanceof Error ? e.message : m.org_switcher_failed());
			return;
		}

		void navigate({ to: "/dashboard", reloadDocument: true });
	}

	if (orgs.length === 0) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="sm" className="max-w-48">
						<span className="truncate">
							{currentOrg?.name ?? m.org_switcher_select()}
						</span>
						<CaretDownIcon data-icon="inline-end" />
					</Button>
				}
			/>
			<DropdownMenuContent align="start" className="min-w-48">
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				<DropdownMenuGroup>
					{orgs.map((org) => (
						<DropdownMenuItem key={org.id} onClick={() => switchOrg(org.id)}>
							<span className="flex-1 truncate">{org.name}</span>
							<span className="text-muted-foreground">{org.role}</span>
							{org.id === currentOrgId && <CheckIcon className="ms-1" />}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
				{!isDesktop() && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem onClick={() => navigate({ to: "/new-org" })}>
								{m.org_switcher_new()}
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
