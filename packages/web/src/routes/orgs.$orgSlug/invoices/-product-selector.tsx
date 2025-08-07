import { PopoverTrigger } from "@radix-ui/react-popover";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shadcn/components/ui/drawer.tsx";
import { Popover, PopoverContent } from "@/shadcn/components/ui/popover.tsx";
import { useIsMobile } from "@/shadcn/hooks/use-mobile.ts";
import { cn } from "@/shadcn/lib/utils.ts";

export function ProductSelector({
  items,
  onItemSelect,
  value,
  onInputValueChange,
}: {
  items: string[];
  value?: string;
  onItemSelect: (item: string) => void;
  onInputValueChange?: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const handleItemSelect = (item: string) => {
    setSelected(item);
    onItemSelect(item);
    setOpen(false);
  };

  const handleInputChange = (value: string) => {
    setOpen(true); // Keep the dropdown open while typing
    setSelected(""); // Reset selected item when typing
    onInputValueChange?.(value);
  };

  const ButtonTrigger = (
    <Button
      variant="ghost"
      role="combobox"
      aria-expanded={open}
      className="w-full flex-1 justify-between border-none rounded-none focus-visible:z-2 relative"
    >
      {value || <span className="opacity-50">{t("product.select")}</span>}
      <ChevronsUpDownIcon className="opacity-50" />
    </Button>
  );

  const ProductsInput = (
    <CommandInput
      value={value}
      onValueChange={handleInputChange}
      placeholder={isMobile ? t("product.search") : undefined}
      className={cn(
        !isMobile &&
          "rounded-none h-9 p-y1 px-3 focus-visible:z-2 focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      )}
    />
  );

  const ProductsList = (
    <CommandList>
      <CommandEmpty>{t("common.ui.noMatches")}</CommandEmpty>
      {items.map((item, index) => (
        <CommandItem
          className="data-[selected=true]:bg-primary/50"
          key={index}
          value={item}
          onSelect={() => handleItemSelect(item)}
        >
          <CheckIcon className={selected == item ? "opacity-100" : "opacity-0"} />
          {item}
        </CommandItem>
      ))}
    </CommandList>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{ButtonTrigger}</DrawerTrigger>
        <DrawerContent className="bg-popover p-2">
          <DrawerHeader>
            <DrawerTitle>{t("product.select")}</DrawerTitle>
            <DrawerDescription>{t("product.selectDescription")}</DrawerDescription>
          </DrawerHeader>
          <Command>
            {ProductsInput}
            <br className="mb-2" />
            {ProductsList}
          </Command>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Command
      className={cn(
        "p-0 bg-transparent rounded-none overflow-visible",
        "[&>[data-slot=command-input-wrapper]]:border-none [&>[data-slot=command-input-wrapper]]:rounded-none",
        "[&>[data-slot=command-input-wrapper]]:p-0 [&>[data-slot=command-input-wrapper]>svg]:hidden",
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{ProductsInput}</PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-2 rounded-t-none bg-accent"
          asChild
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {ProductsList}
        </PopoverContent>
      </Popover>
    </Command>
  );
}
