import {
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { Eu } from "@/components/flags/eu";
import { Sa } from "@/components/flags/sa";
import { useRouter } from "@tanstack/react-router";

export function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const router = useRouter();

  const languageFlags = {
    en: Eu,
    ar: Sa,
  } as const;

  const languages = Object.keys(languageFlags) as Array<keyof typeof languageFlags>;

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    router.invalidate();
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{t("language")}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {languages.map((lang) => {
          const Icon = languageFlags[lang];
          return (
            <DropdownMenuCheckboxItem
              key={lang}
              checked={i18n.language === lang}
              onClick={() => changeLanguage(lang)}
            >
              <Icon /> {t(`languages.${lang}`)}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
