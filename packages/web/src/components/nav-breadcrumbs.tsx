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

import { useMediaQuery } from "@/hooks/use-media-query";

export function NavigationBreadcrumbs() {
  const matches = useMatches();
  const isMobile = useMediaQuery("(max-width: 640px)");

  const breadcrumbs = matches
    .filter(({ context }) => context?.title)
    .map(({ routeId, pathname, context }) => ({
      routeId,
      pathname,
      title: context.title,
      icon: context.icon ? <context.icon className="size-4" /> : null,
    }));

  const HomeCrumb = (
    <>
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link className="text-base font-medium flex" to={breadcrumbs[0].pathname}>
            {breadcrumbs[0].icon}
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
    </>
  );

  const ActiveCrumb = (
    <BreadcrumbItem>
      <BreadcrumbPage className="text-base font-medium">
        {breadcrumbs[breadcrumbs.length - 1].title ?? ""}
      </BreadcrumbPage>
    </BreadcrumbItem>
  );

  // Get the middle crumbs, excluding the first (home) and last (active) crumbs
  //
  // We also filter out the last crumb if it is the same as the current but with a trailing slash
  const otherCrumbs = breadcrumbs
    .slice(1, -1)
    .filter(({ routeId }) => routeId + "/" !== breadcrumbs[breadcrumbs.length - 1].routeId);

  // For mobile: show home > ... > current route
  if (isMobile && breadcrumbs.length > 2) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          {HomeCrumb}

          {/* Middle ellipsis - only if we have more than home and current */}
          {otherCrumbs.length >= 1 && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    className="text-base font-medium"
                    to={otherCrumbs[otherCrumbs.length - 1].pathname}
                  >
                    ..
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}

          {ActiveCrumb}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Desktop: show full breadcrumb
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {HomeCrumb}

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

        {ActiveCrumb}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
