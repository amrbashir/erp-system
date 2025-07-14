import { useEffect } from "react";

import type { DependencyList } from "react";

export function useHotkeys(
  keys: Record<string, (event: KeyboardEvent) => void>,
  deps: DependencyList = [],
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
