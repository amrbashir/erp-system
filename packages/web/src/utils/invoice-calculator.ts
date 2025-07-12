import { Decimal } from "decimal.js";

export function calculateItemSubtotal(price: string | number, quantity: number) {
  return new Decimal(price).mul(quantity);
}

export function calculateItemDiscount(
  subtotal: number | Decimal,
  discountPercent?: number,
  discountAmount?: string | number,
) {
  const subtotalDecimal = subtotal instanceof Decimal ? subtotal : new Decimal(subtotal);
  const percentDiscount = subtotalDecimal.mul((discountPercent || 0) / 100);
  return {
    percentDiscount,
    totalDiscount: new Decimal(discountAmount ?? 0).add(percentDiscount),
  };
}

export function calculateItemTotal(
  price: string | number,
  quantity: number,
  discountPercent?: number,
  discountAmount?: string | number,
) {
  const subtotal = calculateItemSubtotal(price, quantity);
  const { totalDiscount } = calculateItemDiscount(subtotal, discountPercent, discountAmount);
  return subtotal.minus(totalDiscount);
}

export function calculateInvoiceSubtotal(
  items: Array<{
    price?: string | number;
    purchasePrice?: string | number;
    quantity: number;
    discountPercent?: number;
    discountAmount?: string | number;
  }>,
  invoiceType: "SALE" | "PURCHASE",
) {
  return items.reduce((total, item) => {
    const price = invoiceType === "PURCHASE" ? item.purchasePrice : item.price;
    return calculateItemTotal(
      price || 0,
      item.quantity,
      item.discountPercent ?? 0,
      item.discountAmount ?? "0",
    ).add(total);
  }, new Decimal(0));
}

export function calculateInvoicePercentDiscount(
  subtotal: number | Decimal,
  discountPercent: number,
) {
  const subtotalDecimal = subtotal instanceof Decimal ? subtotal : new Decimal(subtotal);
  return subtotalDecimal.mul(discountPercent).div(100);
}

export function calculateInvoiceTotal(
  subtotal: number | Decimal,
  discountPercent: number = 0,
  discountAmount: string | number = 0,
) {
  const subtotalDecimal = subtotal instanceof Decimal ? subtotal : new Decimal(subtotal);
  const percentDiscount = calculateInvoicePercentDiscount(subtotal, discountPercent);
  return subtotalDecimal.minus(percentDiscount).minus(discountAmount);
}
