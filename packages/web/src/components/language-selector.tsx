import { useRouter } from "@tanstack/react-router";
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

import { Sa } from "@/components/flags/sa";
import { Uk } from "@/components/flags/uk";

const LANGUAGE_FLAGS = {
  "en-US": Uk,
  "ar-EG": Sa,
} as const;

type LanguageFlagKey = keyof typeof LANGUAGE_FLAGS;

const LANGUAGES = Object.keys(LANGUAGE_FLAGS) as Array<LanguageFlagKey>;

export function LanguageSelector({ asSubmenu = false }: { asSubmenu?: boolean }) {
  const { i18n, t } = useTranslation();
  const router = useRouter();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    router.invalidate();
  };

  const Menu = asSubmenu ? DropdownMenuSub : DropdownMenu;
  const MenuTrigger = asSubmenu ? DropdownMenuSubTrigger : DropdownMenuTrigger;
  const MenuContent = asSubmenu ? DropdownMenuSubContent : DropdownMenuContent;

  const ActiveIcon = LANGUAGE_FLAGS[i18n.language as LanguageFlagKey];

  return (
    <Menu>
      <MenuTrigger asChild={!asSubmenu}>
        {asSubmenu ? (
          t("language.language")
        ) : (
          <Button title={t("language.changeLanguage")} variant="outline">
            <>
              <ActiveIcon />
              <span className="hidden md:inline">
                {t(`language.languages.${i18n.language as LanguageFlagKey}`)}
              </span>
            </>
          </Button>
        )}
      </MenuTrigger>
      <MenuContent>
        {LANGUAGES.map((lang) => {
          const Icon = LANGUAGE_FLAGS[lang];
          return (
            <DropdownMenuCheckboxItem
              key={lang}
              checked={i18n.language === lang}
              onClick={() => changeLanguage(lang)}
            >
              <Icon /> {t(`language.languages.${lang}`)}
            </DropdownMenuCheckboxItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
}
