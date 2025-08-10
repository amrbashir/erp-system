import { useStore } from "@tanstack/react-form";
import { ChevronUpIcon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/shadcn/components/ui/card.tsx";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shadcn/components/ui/drawer.tsx";
import { Label } from "@/shadcn/components/ui/label.tsx";
import { Separator } from "@/shadcn/components/ui/separator.tsx";
import { useIsMobile } from "@/shadcn/hooks/use-mobile.ts";
import { cn } from "@/shadcn/lib/utils.ts";

import type { InvoiceType } from "@erp-system/server/prisma/index.ts";
import type { ReactFormExtendedApi } from "@tanstack/react-form";

import { InputNumpad } from "@/components/ui/input-numpad.tsx";
import { formatMoney } from "@/utils/formatMoney.ts";
import {
  calculateInvoicePercentDiscount,
  calculateInvoiceRemaining,
  calculateInvoiceSubtotal,
  calculateInvoiceTotal,
} from "@/utils/invoice-calculator.ts";
import { SafeDecimal } from "@/utils/SafeDecimal.ts";

type InvoiceItem = {
  barcode?: string;
  description?: string;
  quantity: number;
  price?: string;
  purchasePrice?: string;
};

type Invoice = {
  items: InvoiceItem[];
  discountPercent?: number;
  discountAmount?: string;
  paid: string;
};

export function InvoiceFooter<TInvoice extends Invoice & { items: InvoiceItem[] }>({
  invoiceType,
  form,
  ...props
}: {
  invoiceType: InvoiceType;
  // deno-lint-ignore no-explicit-any
  form: ReactFormExtendedApi<TInvoice, any, any, any, any, any, any, any, any, any, any, any>;
} & React.ComponentProps<typeof Card>) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const [invoiceItems, discountPercent, discountAmount, paid] = useStore(form.store, (state) => [
    state.values.items,
    state.values.discountPercent,
    state.values.discountAmount,
    state.values.paid,
  ]);

  const subtotal = React.useMemo(
    () => calculateInvoiceSubtotal(invoiceItems, invoiceType),
    [invoiceItems],
  );

  const percentDiscount = calculateInvoicePercentDiscount(subtotal, discountPercent);
  const totalPrice = calculateInvoiceTotal(subtotal, discountPercent, discountAmount);
  const remainingAmount = calculateInvoiceRemaining(totalPrice, paid);

  const FooterCard = (
    <Card className={cn("md:w-fit md:ms-auto gap-2 p-2", isMobile && "border-none")} {...props}>
      <CardContent className="grid grid-cols-[auto_1fr_auto] items-center gap-2 p-2">
        <Label className="font-semibold">{t("common.form.subtotal")}:</Label>
        <span></span>
        <span className="text-end font-semibold">{formatMoney(subtotal)}</span>

        <form.Field
          name="discountPercent"
          children={(field) => (
            <>
              <Label htmlFor={field.name}>{t("common.form.discountPercent")}:</Label>
              <InputNumpad
                name={field.name}
                className="w-20"
                value={field.state.value as number}
                onChange={(e) => field.handleChange(e.target.valueAsNumber as any)}
                min={0}
                max={100}
              />
            </>
          )}
        />
        <span className="text-end">-{formatMoney(percentDiscount)}</span>

        <form.Field
          name="discountAmount"
          children={(field) => (
            <>
              <Label htmlFor={field.name}>{t("common.form.discountAmount")}:</Label>
              <InputNumpad
                name={field.name}
                className="w-20"
                value={new SafeDecimal((field.state.value as string) || 0).toNumber()}
                onChange={(e) => field.handleChange(e.target.value as any)}
                min={0}
                max={subtotal.toNumber()}
              />
            </>
          )}
        />
        <span className="text-end">-{formatMoney(discountAmount || 0)}</span>

        <Separator className="col-span-3 my-1" />

        <Label className="font-bold">{t("common.form.total")}:</Label>
        <span></span>
        <span className="text-end font-bold">{formatMoney(totalPrice)}</span>

        <form.Field
          name="paid"
          children={(field) => (
            <>
              <Label htmlFor={field.name}>{t("common.form.paid")}:</Label>
              <InputNumpad
                name={field.name}
                className="w-20"
                value={new SafeDecimal((field.state.value as string) || 0).toNumber()}
                onChange={(e) => field.handleChange(e.target.value as any)}
                min={0}
                max={totalPrice.toNumber()}
              />
            </>
          )}
        />
        <span
          className={cn(
            "text-end",
            invoiceType === "SALE"
              ? "text-green-500 dark:text-green-300"
              : "text-red-500 dark:text-red-300",
          )}
        >
          {formatMoney(paid || 0)}
        </span>

        <Label>{t("common.form.remaining")}:</Label>
        <span></span>
        <span className="text-end text-red-500 dark:text-red-300">
          {formatMoney(remainingAmount)}
        </span>
      </CardContent>
    </Card>
  );

  return isMobile ? (
    <Drawer>
      <DrawerTrigger className="w-full flex items-center justify-center">
        <ChevronUpIcon />
      </DrawerTrigger>
      <DrawerContent className="bg-popover">
        <DrawerHeader>
          <DrawerTitle>{t("invoice.total")}</DrawerTitle>
          <DrawerDescription className="hidden">{t("invoice.total")}</DrawerDescription>
        </DrawerHeader>

        {FooterCard}
      </DrawerContent>
    </Drawer>
  ) : (
    FooterCard
  );
}
