import { Link, useMatches } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

function NavigationBreadcrumbs() {
  const matches = useMatches();

  const breadcrumbs = matches
    .filter(({ loaderData }) => loaderData?.title)
    .map(({ pathname, loaderData }) => ({
      path: pathname,
      title: loaderData?.title,
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

export function NavigationHeader() {
  return (
    <header className="flex items-center gap-1 w-full border-b">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
      <NavigationBreadcrumbs />
    </header>
  );
}
