import { Link, useLocation, useRouter } from "@tanstack/react-router";
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
import { ThemeModeToggle } from "@/components/theme-mode-toggle";

function NavigationBreadCrumbs() {
  const { flatRoutes } = useRouter();
  const routes = flatRoutes.map((route) => {
    return {
      url: route.fullPath,
      title: route.options.context().title,
      breadCrumb: route.options.context().breadCrumb,
    };
  });

  const pathname = useLocation({ select: (state) => state.pathname });

  const segments = pathname.split("/").slice(1);
  const segmentsRoutes = segments
    .map((_, index) => {
      const url = `/${segments.slice(0, index + 1).join("/")}`;
      return routes.find((route) => route.url === url);
    })
    .filter((r) => !!r);

  // add the root route if not already included
  const rootRoute = routes.find((route) => route.url === "/")!;
  if (segmentsRoutes.length === 0 || segmentsRoutes[0].url !== rootRoute.url) {
    segmentsRoutes.unshift(rootRoute);
  }

  const activeSegment = segmentsRoutes[segmentsRoutes.length - 1];
  const otherSegments = segmentsRoutes.slice(0, -1);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {otherSegments.map((route) => (
          <Fragment key={route.url}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link className="text-base font-medium" to={route.url}>
                  {route.breadCrumb ? route.breadCrumb : route.title}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}

        <BreadcrumbItem>
          <BreadcrumbPage className="text-base font-medium">
            {activeSegment.breadCrumb ? activeSegment.breadCrumb : activeSegment.title}
          </BreadcrumbPage>
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
      <NavigationBreadCrumbs />
      <div className="flex-1" />
      <ThemeModeToggle />
    </header>
  );
}
