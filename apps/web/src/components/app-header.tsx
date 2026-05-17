import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { IS_DESKTOP } from "@workspace/desktop";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { LanguageSwitcher } from "@workspace/ui/components/language-switcher";
import { ThemeSwitcher } from "@workspace/ui/components/theme-switcher";
import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

import { signOut } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

export function AppHeader({
	leadingSlot,
	trailingSlot,
	borderless = false,
}: {
	leadingSlot?: ReactNode;
	trailingSlot?: ReactNode;
	borderless?: boolean;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: session } = useQuery(orpc.session.get.queryOptions());

	async function handleLogout() {
		await signOut();
		queryClient.clear();
		if (IS_DESKTOP) {
			window.location.href = "/";
			return;
		}
		void navigate({ to: "/login" });
	}

	return (
		<header className={cn("flex items-center gap-2 px-4 py-2", !borderless && "border-b")}>
			{leadingSlot}
			<nav className="ms-auto flex items-center gap-2">
				<ThemeSwitcher />
				<LanguageSwitcher />
				{session && (
					<Button variant="ghost" size="sm" onClick={handleLogout}>
						{m.nav_logout()}
					</Button>
				)}
				{trailingSlot}
			</nav>
		</header>
	);
}
