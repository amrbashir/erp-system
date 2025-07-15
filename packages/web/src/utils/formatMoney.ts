import { Decimal } from "decimal.js";

export function formatMoney(
  value: string | number | Decimal,
  options: { signDisplay?: "auto" | "always" } = { signDisplay: "auto" },
): string {
  const numValue = value instanceof Decimal ? value : new Decimal(value);
  return numValue.toNumber().toLocaleString("en-US", {
    style: "currency",
    currency: "EGP",
    signDisplay: options.signDisplay,
  });
}
