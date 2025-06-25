import { useTranslation } from "react-i18next";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/shadcn/components/ui/dropdown-menu";

import { THEME_VARIANTS, useTheme } from "@/components/theme-provider";

export function ThemeSelector() {
  const { t } = useTranslation();
  const { setTheme, theme: currentTheme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{t("theme")}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
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
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
