import { CornerDownLeftIcon, DeleteIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";

// prettier-ignore
const KEYS = [
  { key: "1", gridSpan: "row-start-1 col-start-1" },
  { key: "2", gridSpan: "row-start-1 col-start-2" },
  { key: "3", gridSpan: "row-start-1 col-start-3" },
  { key: "Del", gridSpan: "row-start-1 col-start-4 text-red-500 hover:text-red-500 dark:text-red-300 dark:hover:text-red-300", icon: DeleteIcon },
  { key: "4", gridSpan: "row-start-2 col-start-1" },
  { key: "5", gridSpan: "row-start-2 col-start-2" },
  { key: "6", gridSpan: "row-start-2 col-start-3" },
  { key: "Enter", gridSpan: "row-start-2 row-end-5 col-start-4 text-green-500 hover:text-green-500 dark:text-green-300 dark:hover:text-green-300", icon: CornerDownLeftIcon },
  { key: "7", gridSpan: "row-start-3 col-start-1" },
  { key: "8", gridSpan: "row-start-3 col-start-2" },
  { key: "9", gridSpan: "row-start-3 col-start-3" },
  { key: "0", gridSpan: "row-start-4 col-start-1 col-span-2" },
  { key: ".", gridSpan: "row-start-4 col-start-3" },
]

type OnSubmit = (values: {
  value: string | number | readonly string[] | undefined;
  valueAsNumber: number;
}) => void;

export function Numpad({
  value: outerValue,
  className,
  onSubmit,
  ...props
}: {
  value: string | number | readonly string[] | undefined;
  onSubmit?: OnSubmit;
  min?: number;
  max?: number;
} & React.ComponentProps<"div">) {
  const [value, setValue] = useState(outerValue || "0");
  const [valueAsNumber, setValueAsNumber] = useState(parseFloat(value.toString()));

  const inputRef = useRef<HTMLInputElement>(null);

  const handleKey = useCallback(
    (key: string) => {
      const currentVal = value.toString();
      let newValue;
      const start = inputRef.current?.selectionStart || 0;
      const end = inputRef.current?.selectionEnd || 0;

      if (key === "Del") {
        if (start === end) {
          // No selection, delete one character before cursor
          newValue = currentVal.slice(0, Math.max(0, start - 1)) + currentVal.slice(start);
        } else {
          // Delete selected text
          newValue = currentVal.slice(0, start) + currentVal.slice(end);
        }
        // If deleting everything, reset to "0"
        if (newValue === "") newValue = "0";
      } else if (key === "." && currentVal.toString().includes(".")) {
        // Prevent adding multiple decimal points
        return;
      } else {
        if (currentVal === "0" && key !== ".") {
          // Replace the initial "0" with the new digit
          newValue = key;
        } else if (start === end) {
          // No selection, insert at cursor position
          newValue = currentVal.slice(0, start) + key + currentVal.slice(start);
        } else {
          newValue = currentVal.slice(0, start) + key + currentVal.slice(end);
        }
      }

      if (newValue) {
        setValue(newValue);
        setValueAsNumber(parseFloat(newValue));
      }
    },
    [value],
  );

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        lang="en-US"
        value={value}
        className="p-4 text-center outline-none bg-transparent border rounded"
        readOnly
        onChange={(e) => {
          setValue(e.target.value);
          setValueAsNumber(parseFloat(e.target.value));
        }}
      />

      <div className="grid grid-cols-4 grid-rows-4 gap-[1px] overflow-hidden" dir="ltr">
        {KEYS.map(({ key, gridSpan, icon: Icon }) => (
          <Button
            className={cn("min-h-15 min-w-15 h-full rounded-none", gridSpan)}
            variant="secondary"
            key={key}
            onClick={() =>
              key === "Enter" ? onSubmit?.({ value, valueAsNumber }) : handleKey(key)
            }
          >
            {Icon ? <Icon /> : <span>{key}</span>}
          </Button>
        ))}
      </div>
    </div>
  );
}
