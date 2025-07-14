import { useEffect } from "react";

export function useHotkeys(
  keys: Record<string, (event: KeyboardEvent) => void>,
  deps: any[] = [],
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const handler = keys[event.key];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keys, ...deps]);
}
