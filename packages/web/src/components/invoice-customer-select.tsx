import { Popover } from "@radix-ui/react-popover";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shadcn/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/components/ui/command";
import { Label } from "@/shadcn/components/ui/label";
import { PopoverContent, PopoverTrigger } from "@/shadcn/components/ui/popover";
import { cn } from "@/shadcn/lib/utils";

import type { CustomerEntity } from "@erp-system/sdk/zod";
import type { AnyFieldApi } from "@tanstack/react-form";
import type z from "zod";

import { AddCustomerDialog } from "./add-customer-dialog";

type Customer = z.infer<typeof CustomerEntity>;

// Customer selection dropdown component
export function CustomerSelect({
  customers = [],
  field,
}: {
  customers: Customer[] | undefined;
  field: AnyFieldApi;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | undefined>(undefined);
  const [customerSearch, setCustomerSearch] = useState("");

  function handleCustomerCreated(customer: Customer) {
    field.handleChange(customer.id);
    setSelectedCustomer(customer.name);
    setCustomerSearch(customer.name);
    setOpen(false);
  }

  function handleCustomerSelect(customer: Customer) {
    field.handleChange(customer.id);
    setOpen(false);
  }

  return (
    <div className="flex gap-2">
      <Label htmlFor={field.name}>{t("customer.name")}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 sm:w-sm justify-between"
          >
            {field.state.value
              ? customers?.find((c) => c.id === field.state.value)?.name
              : t("customer.select")}
            <ChevronsUpDownIcon className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-1rem)] translate-x-[0.5rem]! sm:w-sm p-0">
          <Command value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <div className="flex items-center *:first:flex-1 gap-2 p-1 *:data-[slot=command-input-wrapper]:px-0 *:data-[slot=command-input-wrapper]:ps-2">
              <CommandInput
                placeholder={t("customer.search")}
                value={customerSearch}
                onValueChange={(v) => setCustomerSearch(v)}
              />
              <AddCustomerDialog
                initialName={customerSearch}
                onCreated={handleCustomerCreated}
                trigger={
                  <Button variant="ghost" size="icon">
                    <PlusIcon />
                  </Button>
                }
              />
            </div>
            <CommandList>
              <CommandEmpty>{t("customer.nomatches")}</CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.name}
                    onSelect={() => handleCustomerSelect(customer)}
                  >
                    {customer.name}
                    <CheckIcon
                      className={cn(
                        "ml-auto",
                        field.state.value === customer.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
