import { Input } from "@/shadcn/components/ui/input";
import { cn } from "@/shadcn/lib/utils";

export function InputNumber({ className, type, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      type="number"
      className={cn(
        className,
        "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
      )}
      {...props}
    />
  );
}
