import { createFileRoute, redirect } from "@tanstack/react-router";

import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/")({
	beforeLoad: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData(
			orpc.session.get.queryOptions(),
		);
		if (session) throw redirect({ to: "/dashboard" });
		throw redirect({ to: "/login" });
	},
});
