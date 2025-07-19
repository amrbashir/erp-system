import { Decimal } from "decimal.js";
import { ChevronUpIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/shadcn/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shadcn/components/ui/drawer";
import { Separator } from "@/shadcn/components/ui/separator";
import { cn } from "@/shadcn/lib/utils";

import type { InvoiceEntity } from "@erp-system/sdk/zod";
import type z from "zod";

import { InputNumpad } from "@/components/ui/input-numpad";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatMoney } from "@/utils/formatMoney";
import {
  calculateInvoicePercentDiscount,
  calculateInvoiceRemaining,
  calculateInvoiceTotal,
} from "@/utils/invoice-calculator";
import { SafeDecimal } from "@/utils/SafeDecimal";

interface Invoice {
  discountPercent: number;
  discountAmount: string;
  paid: string;
}

export function InvoiceFooter<T extends Invoice>({
  invoiceType,
  subtotal,
  discountPercent,
  discountAmount,
  paid,
  onUpdateInvoiceField,
  ...props
}: {
  invoiceType: z.infer<typeof InvoiceEntity>["type"];
  subtotal: Decimal;
  discountPercent?: number;
  discountAmount?: string;
  paid: string;
  onUpdateInvoiceField: (field: keyof T, value: number | string) => void;
} & React.ComponentProps<typeof Card>) {
  const { t } = useTranslation();

  const percentDiscount = calculateInvoicePercentDiscount(subtotal, discountPercent);
  const totalPrice = calculateInvoiceTotal(subtotal, discountPercent, discountAmount);
  const remainingAmount = calculateInvoiceRemaining(totalPrice, paid);

  const isMobile = useMediaQuery("(max-width: 768px)");

  const FooterCard = (
    <Card className={cn("md:w-fit md:ms-auto gap-2 p-2", isMobile && "border-none")} {...props}>
      <CardContent className="grid grid-cols-[auto_1fr_auto] items-center gap-2 p-2">
        <span className="font-semibold">{t("common.ui.subtotal")}:</span>
        <span></span>
        <span className="text-end font-semibold">{formatMoney(subtotal)}</span>

        <span>{t("common.ui.discountPercent")}:</span>
        <InputNumpad
          className="w-20"
          value={discountPercent}
          onChange={(e) => onUpdateInvoiceField("discountPercent", e.target.valueAsNumber)}
          min={0}
          max={100}
        />
        <span className="text-end">-{formatMoney(percentDiscount)}</span>

        <span>{t("common.ui.discountAmount")}:</span>
        <InputNumpad
          className="w-20"
          value={new SafeDecimal(discountAmount || 0).toNumber()}
          onChange={(e) => onUpdateInvoiceField("discountAmount", e.target.value)}
          min={0}
          max={subtotal.toNumber()}
        />
        <span className="text-end">-{formatMoney(discountAmount || 0)}</span>

        <Separator className="col-span-3 my-1" />

        <span className="font-bold">{t("common.ui.total")}:</span>
        <span></span>
        <span className="text-end font-bold">{formatMoney(totalPrice)}</span>

        <span>{t("common.ui.paid")}:</span>
        <InputNumpad
          className="w-20"
          value={new SafeDecimal(paid || 0).toNumber()}
          onChange={(e) => onUpdateInvoiceField("paid", e.target.value)}
          min={0}
          max={totalPrice.toNumber()}
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

        <span>{t("common.ui.remaining")}:</span>
        <span></span>
        <span
          className={cn(
            "text-end",
            remainingAmount.greaterThan(0) &&
              (invoiceType === "SALE"
                ? "text-red-500 dark:text-red-300"
                : "text-blue-500 dark:text-blue-300"),
          )}
        >
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
          <DrawerDescription>{t("invoice.totalDescription")}</DrawerDescription>
        </DrawerHeader>

        {FooterCard}
      </DrawerContent>
    </Drawer>
  ) : (
    FooterCard
  );
}
