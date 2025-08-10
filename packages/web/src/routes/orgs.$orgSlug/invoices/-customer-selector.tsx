import { Popover } from "@radix-ui/react-popover";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shadcn/components/ui/button.tsx";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/components/ui/command.tsx";
import { Drawer, DrawerContent, DrawerTrigger } from "@/shadcn/components/ui/drawer.tsx";
import { Label } from "@/shadcn/components/ui/label.tsx";
import { PopoverContent, PopoverTrigger } from "@/shadcn/components/ui/popover.tsx";
import { useIsMobile } from "@/shadcn/hooks/use-mobile.ts";

import type { Customer } from "@erp-system/server/prisma/index.ts";

import { CustomerDialog } from "@/routes/orgs.$orgSlug/customers/-customer-dialog.tsx";

// Customer selection dropdown component
export function CustomerSelector({
  customers = [],
  name,
  value,
  onChange,
}: {
  customers: Customer[] | undefined;
  name?: string;
  value?: number;
  onChange?: (value: number | undefined) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<string | undefined>(undefined);
  const [customerSearch, setCustomerSearch] = React.useState("");
  const isMobile = useIsMobile();

  const handleCustomerCreated = (customer: Customer) => {
    setSelectedCustomer(customer.name);
    onChange?.(customer.id);
    setOpen(false);
  };

  const handleCustomerSelect = (customer: Customer | undefined) => {
    onChange?.(customer?.id);
    setOpen(false);
  };

  const selectedCustomerName = customers?.find((c) => c.id === value)?.name;

  const ButtonTrigger = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full md:w-sm flex-1 justify-between"
    >
      {value ? selectedCustomerName : <span className="opacity-50">{t("customer.without")}</span>}
      <ChevronsUpDownIcon className="opacity-50" />
    </Button>
  );

  const CustomersCommandList = (
    <Command
      value={selectedCustomer}
      onValueChange={setSelectedCustomer}
      className="w-(--radix-popover-trigger-width) p-2"
    >
      <div className="flex justify- *:first:flex-1">
        <CommandInput
          placeholder={t("customer.search")}
          value={customerSearch}
          onValueChange={(v) => setCustomerSearch(v)}
        />
        <CustomerDialog
          action="create"
          iconOnly
          customer={{ name: customerSearch } as Customer}
          onCreated={handleCustomerCreated}
        />
      </div>
      <CommandList>
        <CommandEmpty>{t("common.ui.noMatches")}</CommandEmpty>
        <CommandItem onSelect={() => handleCustomerSelect(undefined)}>
          <CheckIcon className={value === undefined ? "opacity-100" : "opacity-0"} />
          {t("customer.without")}
        </CommandItem>
        {customers.map((customer) => (
          <CommandItem
            key={customer.id}
            value={customer.name}
            onSelect={() => handleCustomerSelect(customer)}
          >
            <CheckIcon className={value === customer.id ? "opacity-100" : "opacity-0"} />
            {customer.name}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{ButtonTrigger}</DrawerTrigger>
        <DrawerContent className="bg-popover p-2">{CustomersCommandList}</DrawerContent>
      </Drawer>
    );
  }

  return (
    <div className="flex gap-2">
      <Label htmlFor={name}>{t("customer.name")}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{ButtonTrigger}</PopoverTrigger>
        <PopoverContent asChild>{CustomersCommandList}</PopoverContent>
      </Popover>
    </div>
  );
}
