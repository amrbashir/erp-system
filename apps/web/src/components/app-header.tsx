import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { LanguageSwitcher } from "@workspace/ui/components/language-switcher";
import { ThemeSwitcher } from "@workspace/ui/components/theme-switcher";
import type { ReactNode } from "react";

import { isDesktop } from "@/lib/activation";
import { clearToken } from "@/lib/api-fetch";
import { signOut } from "@/lib/auth-client";

export function AppHeader({
	leadingSlot,
	showLogout = false,
}: {
	leadingSlot?: ReactNode;
	showLogout?: boolean;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	async function handleLogout() {
		await signOut();
		// Clear the query cache so the new login/onboarding pass through doesn't
		// see the stale (logged-in) session via ensureQueryData.
		queryClient.clear();
		if (isDesktop()) {
			clearToken();
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
				{showLogout && (
					<Button variant="ghost" size="sm" onClick={handleLogout}>
						{m.nav_logout()}
					</Button>
				)}
			</div>
		</header>
	);
}
