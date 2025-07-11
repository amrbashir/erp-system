/**
 * Formats a currency value from base units (stored in the database) to major units for display
 * For example: 1 USD = 100 cents, 1 EUR = 100 cents, 1 EGP = 100 piasters
 *
 * @param value The amount in base units (e.g., cents, piasters)
 * @param currency The currency code (e.g., 'USD', 'EUR', 'EGP')
 * @param locale The locale to use for formatting
 * @returns Formatted currency string in major units (e.g., dollars, euros, pounds)
 */
export function formatCurrency(
  value: number,
  currency: string = "EGP",
  locale: string = "en-US",
): string {
  // Convert from base units to major units (assuming 100 base units = 1 major unit)
  const valueInMajorUnits = toMajorUnits(value);

  return valueInMajorUnits.toLocaleString(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converts a value from major currency units to base units
 * For example: dollars to cents, euros to cents, pounds to piasters
 *
 * @param valueInMajorUnits The amount in major units (e.g., dollars, euros, pounds)
 * @returns The amount in base units (integer)
 */
export function toBaseUnits(valueInMajorUnits: number): number {
  return valueInMajorUnits * 100;
}

/**
 * Converts a value from base units to major currency units
 * For example: cents to dollars, cents to euros, piasters to pounds
 *
 * @param valueInBaseUnits The amount in base units (e.g., cents, piasters)
 * @returns The amount in major units (e.g., dollars, euros, pounds)
 */
export function toMajorUnits(valueInBaseUnits: number): number {
  return valueInBaseUnits / 100;
}
