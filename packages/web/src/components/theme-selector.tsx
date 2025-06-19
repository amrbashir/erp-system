import {
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { useTheme, themeVariants } from "@/components/theme-provider";
import { useTranslation } from "react-i18next";

export function ThemeSelector() {
  const { t } = useTranslation();
  const { setTheme, theme: currentTheme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{t("theme")}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {themeVariants.map(({ theme, icon: Icon }) => {
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
