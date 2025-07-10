import { formatCurrency as _formatCurrency } from "@erp-system/utils";
import { useTranslation } from "react-i18next";

export function useFormatCurrency() {
  const { i18n } = useTranslation();
  // TODO: make currency configurable, for now we assume EGP
  return { formatCurrency: (v: number) => _formatCurrency(v, "EGP", i18n.language) };
}
