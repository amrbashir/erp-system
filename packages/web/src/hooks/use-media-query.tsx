import * as React from "react";

export function useMediaQuery(query: string): boolean {
  const [isMatch, setIsMatch] = React.useState(() => window.matchMedia(query).matches);

  React.useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const documentChangeHandler = () => setIsMatch(mediaQueryList.matches);
    mediaQueryList.addEventListener("change", documentChangeHandler);
    return () => mediaQueryList.removeEventListener("change", documentChangeHandler);
  }, [query]);

  return isMatch;
}
