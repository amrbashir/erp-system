import { PopoverTrigger } from "@radix-ui/react-popover";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shadcn/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/components/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shadcn/components/ui/drawer";
import { Popover, PopoverContent } from "@/shadcn/components/ui/popover";
import { cn } from "@/shadcn/lib/utils";

import { useMediaQuery } from "@/hooks/use-media-query";

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
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

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
      placeholder={isDesktop ? undefined : t("product.search")}
      className={cn(
        isDesktop &&
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

  if (isDesktop) {
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
