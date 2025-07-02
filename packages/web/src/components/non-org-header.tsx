import { LanguageSelector } from "@/components/language-selector";
import { ThemeSelector } from "@/components/theme-selector";
import { useOrgSafe } from "@/hooks/use-org";

export function NonOrgHeader() {
  const org = useOrgSafe();
  if (org) return null;

  return (
    <nav className="sticky top-0 z-49 w-screen h-(--header-height) p-4 flex items-center gap-2 backdrop-blur-sm bg-background/80 border-b border-border">
      <div className="flex-1" />
      <LanguageSelector />
      <ThemeSelector />
    </nav>
  );
}
