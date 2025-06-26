import { useMatches } from "@tanstack/react-router";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { LanguageSelector } from "./language-selector";
import { ThemeSelector } from "./theme-selector";

export function NonOrgHeader() {
  const { i18n } = useTranslation();

  const matches = useMatches();
  const currentMatch = matches[matches.length - 1];

  const isOrg = currentMatch?.fullPath.startsWith("/org");

  if (isOrg) return null;

  return (
    <div
      className={clsx(
        "flex items-center absolute top-4 gap-2",
        i18n.dir() === "rtl" ? "left-4" : "right-4",
      )}
    >
      <ThemeSelector />
      <LanguageSelector />
    </div>
  );
}
