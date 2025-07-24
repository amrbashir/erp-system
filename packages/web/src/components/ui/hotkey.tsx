import { useHotkey } from "@/hooks/use-hotkeys";

export function Hotkey({
  hotkey,
  onHotkey,
}: {
  hotkey: string;
  onHotkey: (event: KeyboardEvent) => void;
}) {
  useHotkey(hotkey, onHotkey);

  return (
    <kbd className="hidden md:inline-flex bg-muted text-muted-foreground pointer-events-none h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
      {hotkey}
    </kbd>
  );
}
