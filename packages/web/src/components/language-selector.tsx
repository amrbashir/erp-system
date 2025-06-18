import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Eu } from "@/components/flags/eu";
import { Sa } from "@/components/flags/sa";
import { useRouter } from "@tanstack/react-router";

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const router = useRouter();

  const languageFlags: Record<string, any> = {
    en: <Eu />,
    ar: <Sa />,
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    router.invalidate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {languageFlags[i18n.language]}
          {i18n.language}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {i18n.languages.map((lang) => (
          <DropdownMenuItem key={lang} onClick={() => changeLanguage(lang)}>
            {languageFlags[lang]}
            {lang}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
