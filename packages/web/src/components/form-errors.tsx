import { type AnyFieldApi, type AnyFormState } from "@tanstack/react-form";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * FormFieldError component to display field-specific errors.
 * It checks the field state for errors based on the specified error kind.
 *
 * If there are no errors, it returns null.
 * Otherwise, it renders them using the ErrorElement component.
 */
export function FormFieldError({
  field,
  errorKind = "onSubmit",
}: {
  field: AnyFieldApi;
  errorKind?: keyof typeof field.state.meta.errorMap;
}) {
  const { t } = useTranslation();

  const error = field.state.meta.errorMap[errorKind];
  if (!error) return null;

  return <ErrorElement error={error} fieldName={t(field.name as any)} />;
}

/**
 * FormErrors component to display form-wide errors.
 * It checks the form state for errors based on the specified error kind.
 *
 * If the form is not valid, it returns null.
 * Otherwise, it renders them using the ErrorElement component.
 */
export function FormErrors({
  formState,
  errorKind = "onSubmit",
}: {
  formState: AnyFormState;
  errorKind?: keyof typeof formState.errorMap;
}) {
  if (!formState.isFieldsValid) return null;

  const error = formState.errorMap[errorKind];
  if (!error) return null;

  return <ErrorElement error={error} />;
}

/**
 * ErrorElement component to display error messages.
 * It handles both string and object errors, translating them using i18n.
 *
 * If the error is an object, it checks for a 'code' or 'message'
 * property to determine how to display the error.
 *
 * If the error is an array, it maps through each error and displays them.
 */
function ErrorElement({ error, fieldName }: { error: any; fieldName?: string }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string | string[] | null>(null);

  const errors = Array.isArray(error) ? error : [error];

  const getError = (error: any): string | string[] => {
    return typeof error === "string"
      ? t(`errors.${error}`, { field: fieldName } as any)
      : typeof error === "object" && error.code
        ? t(`validationErrors.${error.code}`, { field: fieldName, ...error })
        : typeof error === "object" && error.message
          ? Array.isArray(error.message)
            ? error.message.map(getError)
            : getError(error.message)
          : getError(error.message);
  };

  useEffect(() => {
    Promise.all(errors)
      .then((e) => e.map((e) => (Array.isArray(e) ? e.map(getError).flat() : getError(e))))
      .then((messages) => setMessage(messages.flat()));
  }, [error, fieldName]);

  return Array.isArray(message) ? (
    message.map((msg, index) => (
      <p key={index} className="text-destructive text-sm">
        {msg}
      </p>
    ))
  ) : (
    <p className="text-destructive text-sm">{message}</p>
  );
}
