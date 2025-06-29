import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";

import { THEME_VARIANTS, useTheme } from "@/providers/theme-provider";

export function ThemeSelector({ asSubmenu = false }: { asSubmenu?: boolean }) {
  const { t } = useTranslation();
  const { setTheme, theme: currentTheme, ThemeIcon } = useTheme();

  const Menu = asSubmenu ? DropdownMenuSub : DropdownMenu;
  const MenuTrigger = asSubmenu ? DropdownMenuSubTrigger : DropdownMenuTrigger;
  const MenuContent = asSubmenu ? DropdownMenuSubContent : DropdownMenuContent;

  return (
    <Menu>
      <MenuTrigger asChild={!asSubmenu}>
        {asSubmenu ? (
          t("theme")
        ) : (
          <Button title={t("changeTheme")} variant="outline">
            {
              <>
                <ThemeIcon />
                <span className="hidden md:inline">{t(`themes.${currentTheme}`)}</span>
              </>
            }
          </Button>
        )}
      </MenuTrigger>
      <MenuContent>
        {THEME_VARIANTS.map(({ theme, icon: Icon }) => {
          return (
            <DropdownMenuCheckboxItem
              key={theme}
              checked={currentTheme === theme}
              onClick={() => setTheme(theme)}
            >
              <Icon /> {t(`themes.${theme}`)}
            </DropdownMenuCheckboxItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
}
