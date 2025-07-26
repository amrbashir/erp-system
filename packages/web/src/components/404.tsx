import { useTranslation } from "react-i18next";

import { ButtonLink } from "./ui/ButtonLink";

export function NotFound404() {
  const { t } = useTranslation();

  return (
    <main className="h-(--fullheight-minus-header) w-full flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl!">{t("common.ui.oops")}</h1>
        <br />
        <br />
        <p>404 - {t("notFound404")}</p>
        <br />
        <br />
        <ButtonLink to="/">{t("goBackHome")}</ButtonLink>
      </div>
    </main>
  );
}
