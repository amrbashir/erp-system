import { useMatches } from "@tanstack/react-router";
import { Button } from "@/shadcn/components/ui/button.tsx";
import { Separator } from "@/shadcn/components/ui/separator.tsx";

import { AmrBashirIcon } from "@/components/icons/AmrBashir.tsx";
import { GithubIcon } from "@/components/icons/GitHub.tsx";
import { LanguageSelector } from "@/components/language-selector.tsx";
import { ThemeSelector } from "@/components/theme-selector.tsx";

export function Header() {
  const matches = useMatches();

  // Don't render the header if we are in an organization route
  // as it has its own header.
  const inOrgRoute = matches.some((match) => match.routeId === "/orgs/$orgSlug");
  if (inOrgRoute) return null;

  return (
    <header className="sticky top-0 z-49 h-(--header-height) p-4 flex items-center gap-2 backdrop-blur-sm bg-background/80 border-b border-border">
      <div className="flex-1" />

      <LanguageSelector />
      <ThemeSelector />

      <Separator orientation="vertical" className="mx-2 h-4" />

      <Button variant="link" className="text-foreground opacity-50 hover:opacity-100 p-0">
        <a href="https://amrbashir.me" target="_blank" rel="noreferrer">
          <AmrBashirIcon className="size-5" />
        </a>
      </Button>
      <Button variant="link" className="text-foreground opacity-50 hover:opacity-100 p-0">
        <a href="https://github.com/amrbashir/erp-system" target="_blank" rel="noreferrer">
          <GithubIcon className="size-5" />
        </a>
      </Button>
    </header>
  );
}
