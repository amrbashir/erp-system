import { useMatches } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LanguageSelector } from "@/components/language-selector";
import { ThemeSelector } from "@/components/theme-selector";

export function NonOrgHeader() {
  const { i18n } = useTranslation();

  const matches = useMatches();
  const currentMatch = matches[matches.length - 1];

  const isOrg = currentMatch?.fullPath.startsWith("/org");

  if (isOrg) return null;

  return (
    <nav className="sticky top-0 z-49 w-screen h-20 p-4 flex items-center gap-2 backdrop-blur-sm bg-background/80 border-b border-border">
      <div className="flex-1" />
      <LanguageSelector />
      <ThemeSelector />
    </nav>
  );
}
