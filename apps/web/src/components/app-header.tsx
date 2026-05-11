import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { LanguageSwitcher } from "@workspace/ui/components/language-switcher";
import { ThemeSwitcher } from "@workspace/ui/components/theme-switcher";
import type { ReactNode } from "react";

import { isDesktop } from "@/lib/activation";
import { signOut } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

export function AppHeader({ leadingSlot }: { leadingSlot?: ReactNode }) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: session } = useQuery(orpc.session.get.queryOptions());

	async function handleLogout() {
		await signOut();
		queryClient.clear();
		if (isDesktop()) {
			window.location.href = "/";
			return;
		}
		void navigate({ to: "/login" });
	}

	return (
		<header className="flex items-center gap-2 border-b px-4 py-2">
			{leadingSlot}
			<div className="ms-auto flex items-center gap-2">
				<ThemeSwitcher />
				<LanguageSwitcher />
				{session && (
					<Button variant="ghost" size="sm" onClick={handleLogout}>
						{m.nav_logout()}
					</Button>
				)}
			</div>
		</header>
	);
}
