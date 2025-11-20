import { useEffect } from "react";

const DEFAULT_TITLE = "Sandy's Market";

export const usePageTitle = (title?: string) => {
  useEffect(() => {
    const previousTitle = document.title || DEFAULT_TITLE;
    document.title = title ?? DEFAULT_TITLE;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};


