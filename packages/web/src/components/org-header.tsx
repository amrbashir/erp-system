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

function NavigationBreadcrumbs() {
  const matches = useMatches();

  const breadcrumbs = matches
    .filter(({ context }) => context?.title)
    .map(({ pathname, context }) => ({
      path: pathname,
      title: context?.title,
    }));

  const activeCrumb = breadcrumbs[breadcrumbs.length - 1];
  const otherCrumbs = breadcrumbs.slice(0, -1);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {otherCrumbs.map((crumb) => (
          <Fragment key={crumb.path}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link className="text-base font-medium" to={crumb.path}>
                  {crumb.title}
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
    <header className="sticky top-0 z-49 flex items-center gap-2 w-full bg-background/50 backdrop-blur-sm border-b px-4 py-2 md:rounded-t-lg">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
      <nav>
        <NavigationBreadcrumbs />
      </nav>
    </header>
  );
}
