import { useTranslation } from "react-i18next";
import { Button } from "@/shadcn/components/ui/button";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/shadcn/components/ui/dropdown-menu";

import { THEME_VARIANTS, useTheme } from "@/providers/theme";

export function ThemeSelector({
  asSubmenu = false,
  iconOnly = true,
}: {
  asSubmenu?: boolean;
  iconOnly?: boolean;
}) {
  const { t } = useTranslation();
  const { setTheme, toggleTheme, theme: currentTheme, ThemeIcon } = useTheme();

  if (asSubmenu) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>{t("theme.theme")}</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {THEME_VARIANTS.map(({ theme, icon: Icon }) => {
            return (
              <DropdownMenuCheckboxItem
                key={theme}
                checked={currentTheme === theme}
                onClick={() => setTheme(theme)}
              >
                <Icon /> {t(`theme.themes.${theme}`)}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  return (
    <Button title={t("theme.changeTheme")} variant="outline" onClick={() => toggleTheme()}>
      {
        <>
          <ThemeIcon />
          {iconOnly ? null : (
            <span className="hidden md:inline">{t(`theme.themes.${currentTheme}`)}</span>
          )}
        </>
      }
    </Button>
  );
}
