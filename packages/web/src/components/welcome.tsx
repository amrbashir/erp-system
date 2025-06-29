import { useTranslation } from "react-i18next";

export function Welcome(props: React.ComponentProps<"div"> & { orgSlug?: string } = {}) {
  const { t } = useTranslation();

  return (
    <div {...props}>
      <img src="/logo.svg" alt="ERP System Logo" width={300} className="mb-10" />
      <h2 className="text-2xl font-semibold text-center">
        {t(props.orgSlug ? "welcomeToErpOrg" : "welcomeToErp", { orgSlug: props.orgSlug })}
      </h2>
      <p className="text-base text-center mt-2 text-gray-400">{t("welcomeToErpDescription")}</p>
    </div>
  );
}
