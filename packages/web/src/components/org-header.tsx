import { Separator } from "@/shadcn/components/ui/separator.tsx";
import { SidebarTrigger } from "@/shadcn/components/ui/sidebar.tsx";

import { NavigationBreadcrumbs } from "@/components/nav-breadcrumbs.tsx";
import { ThemeSelector } from "@/components/theme-selector.tsx";

export function OrgHeader() {
  return (
    <header className="sticky top-0 z-49 h-(--header-height) shrink-0 border-b transition-[width,height] ease-linear px-4  bg-background/50 backdrop-blur-md rounded-t flex items-center justify-between">
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
