import { createFileRoute, redirect } from "@tanstack/react-router";

import { client } from "@/lib/orpc";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const session = await client.session.get();
		if (session) throw redirect({ to: "/dashboard" });
		throw redirect({ to: "/login" });
	},
});
