import { Decimal } from "decimal.js";
import SuperJSON from "superjson";

export function registerSuperJsonExtensions() {
  SuperJSON.registerCustom<Decimal, string>(
    {
      isApplicable: (v): v is Decimal => Decimal.isDecimal(v),
      serialize: (v) => v.toJSON(),
      deserialize: (v) => new Decimal(v),
    },
    "decimal.js",
  );
}
