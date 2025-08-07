import { Decimal } from "decimal.js";

import { SafeDecimal } from "./SafeDecimal.ts";

export function calculateItemSubtotal(price: string | number | Decimal, quantity: number) {
  return new SafeDecimal(price).mul(quantity);
}

export function calculateItemDiscount(
  subtotal: number | Decimal,
  discountPercent?: number,
  discountAmount?: string | number | Decimal,
) {
  const subtotalDecimal = subtotal instanceof Decimal ? subtotal : new SafeDecimal(subtotal);
  const percentDiscount = subtotalDecimal.mul((discountPercent || 0) / 100);
  return {
    percentDiscount,
    totalDiscount: percentDiscount.add(discountAmount || 0),
  };
}

export function calculateItemTotal(
  price: string | number | Decimal,
  quantity: number,
  discountPercent?: number,
  discountAmount?: string | number | Decimal,
) {
  const subtotal = calculateItemSubtotal(price, quantity);
  const { totalDiscount } = calculateItemDiscount(subtotal, discountPercent, discountAmount);
  return subtotal.minus(totalDiscount);
}

export function calculateInvoiceSubtotal(
  items: Array<{
    price?: string | number | Decimal;
    purchasePrice?: string | number | Decimal;
    quantity: number;
    discountPercent?: number;
    discountAmount?: string | number | Decimal;
  }>,
  invoiceType: "SALE" | "PURCHASE",
) {
  return items.reduce((total, item) => {
    const price = invoiceType === "PURCHASE" ? item.purchasePrice : item.price;
    return calculateItemTotal(
      price || 0,
      item.quantity,
      item.discountPercent || 0,
      item.discountAmount || "0",
    ).add(total);
  }, new Decimal(0));
}

export function calculateInvoicePercentDiscount(
  subtotal: number | Decimal,
  discountPercent?: number,
) {
  const subtotalDecimal = subtotal instanceof Decimal ? subtotal : new SafeDecimal(subtotal);
  return subtotalDecimal.mul(discountPercent || 0).div(100);
}

export function calculateInvoiceTotal(
  subtotal: number | Decimal,
  discountPercent?: number,
  discountAmount?: string | number | Decimal,
) {
  const discountAmountDecimal = new SafeDecimal(discountAmount || 0);
  const subtotalDecimal = subtotal instanceof Decimal ? subtotal : new Decimal(subtotal);
  const percentDiscount = calculateInvoicePercentDiscount(subtotal, discountPercent);
  return subtotalDecimal.minus(percentDiscount).minus(discountAmountDecimal);
}

export function calculateInvoiceRemaining(
  total: number | Decimal,
  paid: string | number | Decimal,
) {
  const totalDecimal = total instanceof Decimal ? total : new Decimal(total);
  const paidDecimal = new SafeDecimal(paid || 0);
  return totalDecimal.minus(paidDecimal);
}
