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
        // error.message might contain a namespace separator `:`,
        // so we use a different separator as we don't care about namespaces here
        nsSeparator: "`",
      })}
    </p>
  );
}
