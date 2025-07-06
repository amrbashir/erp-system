import { formatCurrency as _formatCurrency } from "@erp-system/utils";
import { useTranslation } from "react-i18next";

export function formatCurrency(value: number) {
  const { i18n } = useTranslation();
  // TODO: make currency configurable, for now we assume EGP
  return _formatCurrency(value, "EGP", i18n.language);
}
