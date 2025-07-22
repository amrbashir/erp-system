import { Decimal } from "decimal.js";

export type NumberFormatOptionsSignDisplay =
  | "auto"
  | "always"
  | "exceptZero"
  | "negative"
  | "never";

export function formatMoney(
  value: string | number | Decimal,
  options: { signDisplay?: NumberFormatOptionsSignDisplay } = { signDisplay: "auto" },
): string {
  const numValue =
    typeof value === "number"
      ? value
      : value instanceof Decimal
        ? value.toNumber()
        : new Decimal(value).toNumber();

  return numValue.toLocaleString("en-US", {
    style: "currency",
    currency: "EGP",
    signDisplay: options.signDisplay,
  });
}
