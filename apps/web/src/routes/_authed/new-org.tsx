import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";

import { CreateOrgForm } from "@/components/create-org-form";
import { isDesktop } from "@/lib/activation";

export const Route = createFileRoute("/_authed/new-org")({
	beforeLoad: () => {
		// Desktop is single-org per install - multi-org creation is web-only.
		if (isDesktop()) throw redirect({ to: "/" });
	},
	component: NewOrgPage,
});

function NewOrgPage() {
	const navigate = useNavigate();
	return (
		<CreateOrgForm title={m.new_org_title()} onCancel={() => navigate({ to: "/" })} />
	);
}
