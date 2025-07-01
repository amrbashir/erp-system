import { GhostIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function EmptyTable() {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full rounded-lg border flex flex-col items-center justify-center">
      <GhostIcon className="text-muted-foreground/50 size-[20%]" />
      <span className="text-muted-foreground">{t("noDataFound")}</span>
      <span className="text-muted-foreground">{t("noDataFoundDescription")}</span>
    </div>
  );
}
