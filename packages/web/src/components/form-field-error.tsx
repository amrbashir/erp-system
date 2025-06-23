import type { AnyFieldApi } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

export function FieldError({
  field,
  errorKind = "onSubmit",
}: {
  field: AnyFieldApi;
  errorKind?: keyof typeof field.state.meta.errorMap;
}) {
  const { t } = useTranslation();
  const error = field.state.meta.errorMap[errorKind];

  if (!error) return null;

  const fieldName = t(field.name as any);
  const errorMessages = Array.isArray(error)
    ? error.map((err) => t(`validationErrors.${err.code}`, { ...err, field: fieldName }))
    : [t(`validationErrors.${error.code}`, { ...error, field: fieldName })];

  return errorMessages.map((message, index) => (
    <p key={index} className="text-destructive text-sm">
      {message}
    </p>
  ));
}
