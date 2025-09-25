import { useStore } from "@tanstack/react-form";
import { ChevronUpIcon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shadcn/components/ui/card.tsx";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shadcn/components/ui/drawer.tsx";
import { Table, TableBody, TableCell, TableRow } from "@/shadcn/components/ui/table.tsx";
import { useIsMobile } from "@/shadcn/hooks/use-mobile.ts";

import type { InvoiceType } from "@erp-system/server/prisma/index.ts";
import type { ReactFormExtendedApi } from "@tanstack/react-form";

import { InputNumpad } from "@/components/ui/input-numpad.tsx";
import { formatMoney } from "@/utils/formatMoney.ts";
import {
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

export function InvoiceFooter<TInvoice extends Invoice>({
  invoiceType,
  form,
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

  const total = calculateInvoiceTotal(subtotal, discountPercent, discountAmount);
  const remaining = calculateInvoiceRemaining(total, paid);

  const FooterCard = (
    <Card className="p-0 rounded-none">
      <Table>
        <TableBody className="border *:*:not-last:border-e *:*:odd:bg-muted *:*:odd:font-bold *:*:even:w-full">
          <TableRow>
            <TableCell>{t("common.form.subtotal")}</TableCell>
            <TableCell>{formatMoney(subtotal)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("common.form.discountAmount")}</TableCell>
            <TableCell className="p-0">
              <form.Field
                name="discountAmount"
                children={(field) => (
                  <InputNumpad
                    variant="ghost"
                    name={field.name}
                    value={new SafeDecimal((field.state.value as string) || 0).toNumber()}
                    // TODO: Fix type
                    // deno-lint-ignore no-explicit-any
                    onChange={(e) => field.handleChange(e.target.value as any)}
                    min={0}
                    max={subtotal.toNumber()}
                  />
                )}
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("common.form.discountPercent")}</TableCell>
            <TableCell className="p-0">
              <form.Field
                name="discountPercent"
                children={(field) => (
                  <InputNumpad
                    variant="ghost"
                    name={field.name}
                    value={field.state.value as number}
                    // TODO: Fix type
                    // deno-lint-ignore no-explicit-any
                    onChange={(e) => field.handleChange(e.target.valueAsNumber as any)}
                    min={0}
                    max={100}
                  />
                )}
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("common.form.total")}</TableCell>
            <TableCell>{formatMoney(total)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("common.form.paid")}</TableCell>
            <TableCell className="p-0">
              <form.Field
                name="paid"
                children={(field) => (
                  <InputNumpad
                    className={
                      invoiceType === "SALE"
                        ? "text-green-500 dark:text-green-300"
                        : "text-red-500 dark:text-red-300"
                    }
                    variant="ghost"
                    name={field.name}
                    value={new SafeDecimal((field.state.value as string) || 0).toNumber()}
                    // TODO: Fix type
                    // deno-lint-ignore no-explicit-any
                    onChange={(e) => field.handleChange(e.target.value as any)}
                    min={0}
                    max={total.toNumber()}
                  />
                )}
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("common.form.remaining")}</TableCell>
            <TableCell className="text-red-500 dark:text-red-300">
              {formatMoney(remaining)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
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
