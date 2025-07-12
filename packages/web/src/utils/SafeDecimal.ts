import { Decimal } from "decimal.js";

/**
 * SafeDecimal is a wrapper around Decimal that ensures
 * it always initializes with a valid value.
 * If an invalid value is provided, it defaults to 0.
 */
export class SafeDecimal extends Decimal {
  constructor(value: Decimal.Value) {
    try {
      super(value);
    } catch (_) {
      super(0);
    }
  }
}
