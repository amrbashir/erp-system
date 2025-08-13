import { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";

export function ErrorElement({
  error,
  fieldName,
}: {
  error: { message: string };
  fieldName?: string;
}) {
  const { t } = useTranslation();

  return (
    <p className="text-destructive text-sm">
      {"- "}
      {t(`errors.${error.message}` as ParseKeys, {
        field: fieldName,
        nsSeparator: "`",
      })}
    </p>
  );
}
