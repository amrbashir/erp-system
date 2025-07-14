import { PopoverTrigger } from "@radix-ui/react-popover";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shadcn/components/ui/button";
import { Command, CommandInput, CommandItem, CommandList } from "@/shadcn/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/shadcn/components/ui/drawer";
import { Popover, PopoverContent } from "@/shadcn/components/ui/popover";

import { useMediaQuery } from "@/hooks/use-media-query";

export function ProductSelector({
  items,
  onItemSelect,
  value,
}: {
  rounded?: boolean;
  items: string[];
  onItemSelect: (item: string) => void;
} & React.ComponentProps<typeof CommandInput>) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const ButtonTrigger = (
    <Button
      variant="ghost"
      role="combobox"
      aria-expanded={open}
      className="w-full flex-1 justify-between border-none rounded-none focus-visible:z-1 relative"
    >
      {value || <span className="opacity-50">{t("product.select")}</span>}
      <ChevronsUpDownIcon className="opacity-50" />
    </Button>
  );

  const ProductsCommandList = (
    <Command className="w-(--radix-popover-trigger-width) p-2">
      <CommandInput placeholder={t("product.search")} />
      <CommandList>
        {items.map((item, index) => (
          <CommandItem
            key={index}
            value={item}
            onSelect={() => {
              setSelected(item);
              onItemSelect(item);
            }}
          >
            <CheckIcon className={selected == item ? "opacity-100" : "opacity-0"} />
            {item}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{ButtonTrigger}</PopoverTrigger>
        <PopoverContent asChild>{ProductsCommandList}</PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{ButtonTrigger}</DrawerTrigger>
      <DrawerContent className="bg-popover p-2">{ProductsCommandList}</DrawerContent>
    </Drawer>
  );
}
