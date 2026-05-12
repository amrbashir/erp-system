import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { IS_DESKTOP } from "@workspace/desktop";
import { m } from "@workspace/i18n";

import { CreateOrgForm } from "@/components/create-org-form";

export const Route = createFileRoute("/_authed/_app/new-org")({
	beforeLoad: () => {
		// Desktop is single-org per install - multi-org creation is web-only.
		if (IS_DESKTOP) throw redirect({ to: "/home" });
	},
	component: NewOrgPage,
});

function NewOrgPage() {
	const navigate = useNavigate();
	return <CreateOrgForm title={m.new_org_title()} onCancel={() => navigate({ to: "/home" })} />;
}
