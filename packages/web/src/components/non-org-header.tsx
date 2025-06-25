import { Button } from "@/shadcn/components/ui/button";
import { useMatches } from "@tanstack/react-router";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/theme-provider";
import { LanguageSelector } from "./language-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";

export function NonOrgHeader() {
  const { i18n } = useTranslation();
  const { ThemeIcon, toggleTheme } = useTheme();

  const matches = useMatches();
  const route = matches[matches.length - 1];

  const hasSidebar = route.context?.hasSidebar;

  if (hasSidebar) return null;

  return (
    <div
      className={clsx(
        "flex items-center absolute top-4 gap-2",
        i18n.dir() === "rtl" ? "left-4" : "right-4",
      )}
    >
      <Button variant="outline" onClick={toggleTheme}>
        <ThemeIcon />
      </Button>

      <LanguageSelector />
    </div>
  );
}
