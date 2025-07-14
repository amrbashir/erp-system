import { GhostIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function EmptyTable() {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full rounded border flex flex-col items-center justify-center">
      <GhostIcon className="text-muted-foreground opacity-50 size-[20%]" />
      <span className="text-muted-foreground">{t("common.ui.noData")}</span>
    </div>
  );
}
