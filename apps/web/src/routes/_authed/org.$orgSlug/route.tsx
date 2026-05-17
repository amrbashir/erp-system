import { ArrowLeftIcon, HouseIcon, UsersIcon } from "@phosphor-icons/react";
import { Link, Outlet, createFileRoute, redirect, useLocation } from "@tanstack/react-router";
import { IS_DESKTOP } from "@workspace/desktop";
import { m } from "@workspace/i18n";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@workspace/ui/components/sidebar";

import { AppLayout } from "@/layouts/app";

export const Route = createFileRoute("/_authed/org/$orgSlug")({
	beforeLoad: ({ context, params }) => {
		const org = context.orgs.find((o) => o.slug === params.orgSlug);
		if (!org) throw redirect({ to: "/home" });
		return { org };
	},
	component: OrgLayout,
});

function OrgLayout() {
	const { orgSlug } = Route.useParams();
	const { org } = Route.useRouteContext();
	const { pathname } = useLocation();

	const homeHref = `/org/${orgSlug}`;
	const membersHref = `/org/${orgSlug}/members`;
	const isHome = pathname === homeHref;
	const isMembers = pathname.startsWith(membersHref);

	return (
		<SidebarProvider>
			<Sidebar collapsible="icon">
				<SidebarHeader>
					<p className="truncate text-sm font-medium">{org.name}</p>
					<p className="text-muted-foreground truncate text-xs">/{org.slug}</p>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										render={<Link to="/org/$orgSlug" params={{ orgSlug }} />}
										isActive={isHome}
										tooltip={m.nav_home()}
									>
										<HouseIcon />
										<span>{m.nav_home()}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton
										render={
											<Link to="/org/$orgSlug/members" params={{ orgSlug }} />
										}
										isActive={isMembers}
										tooltip={m.nav_members()}
									>
										<UsersIcon />
										<span>{m.nav_members()}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				{!IS_DESKTOP && (
					<SidebarFooter>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									render={<Link to="/home" />}
									tooltip={m.nav_back_to_orgs()}
								>
									<ArrowLeftIcon />
									<span>{m.nav_back_to_orgs()}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarFooter>
				)}
			</Sidebar>
			<SidebarInset>
				<AppLayout leadingSlot={<SidebarTrigger />}>
					<Outlet />
				</AppLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}
