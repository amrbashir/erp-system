import { useMatch } from "@tanstack/react-router";
import { Button } from "@/shadcn/components/ui/button";
import { Separator } from "@/shadcn/components/ui/separator";

import { AmrBashirIcon } from "@/components/icons/AmrBashirIcon";
import { GithubIcon } from "@/components/icons/github";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeSelector } from "@/components/theme-selector";
import { useOrg } from "@/hooks/use-org";

export function Header() {
  const maybeOrg = useOrg({ strict: false });
  if (maybeOrg) return null;

  return (
    <header className="sticky top-0 z-49 w-screen h-(--header-height) p-4 flex items-center gap-2 backdrop-blur-sm bg-background/80 border-b border-border">
      <div className="flex-1" />

      <LanguageSelector />
      <ThemeSelector />

      <Separator orientation="vertical" className="mx-2 h-4" />

      <Button variant="link" className="opacity-50 hover:opacity-100 p-0">
        <a href="https://amrbashir.me" target="_blank">
          <AmrBashirIcon className="size-5" />
        </a>
      </Button>
      <Button variant="link" className="opacity-50 hover:opacity-100 p-0">
        <a href="https://github.com/amrbashir/erp-system" target="_blank">
          <GithubIcon className="size-5" />
        </a>
      </Button>
    </header>
  );
}
