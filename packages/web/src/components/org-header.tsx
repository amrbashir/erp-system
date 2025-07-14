import { Link, useMatches } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shadcn/components/ui/breadcrumb";
import { Separator } from "@/shadcn/components/ui/separator";
import { SidebarTrigger } from "@/shadcn/components/ui/sidebar";

import { ThemeSelector } from "@/components/theme-selector";

function NavigationBreadcrumbs() {
  const matches = useMatches();

  const breadcrumbs = matches
    .filter(({ context }) => context?.title || context?.icon)
    .map(({ pathname, context }) => ({
      pathname,
      title: context.title as string | null,
      icon: context.icon ? <context.icon className="size-4" /> : null,
    }));

  const activeCrumb = breadcrumbs[breadcrumbs.length - 1] ?? "";
  const otherCrumbs = breadcrumbs.slice(0, -1);

  // Remove the first title so it doesn't show in the breadcrumb (usually the home route)
  if (otherCrumbs[0]) otherCrumbs[0].title = null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {otherCrumbs.map(({ pathname, title, icon: RouteIcon }) => (
          <Fragment key={pathname}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link className="text-base font-medium flex" to={pathname}>
                  {title ? title : RouteIcon}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}

        <BreadcrumbItem>
          <BreadcrumbPage className="text-base font-medium">{activeCrumb.title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function OrgHeader() {
  return (
    <header className="sticky top-0 z-10 h-(--header-height) shrink-0 border-b transition-[width,height] ease-linear px-4  bg-background/50 backdrop-blur-md rounded-t flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4!" />
        <nav>
          <NavigationBreadcrumbs />
        </nav>
      </div>
      <div>
        <ThemeSelector iconOnly />
      </div>
    </header>
  );
}
