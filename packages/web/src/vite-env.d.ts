/// <reference types="vite/client" />
import "@tanstack/react-table";
import "i18next";

import { RowData } from "@tanstack/react-table";

// deno-lint-ignore verbatim-module-syntax
import arTranslation from "../public/locales/ar-Eg/translation.json" with { type: "json" };
// deno-lint-ignore verbatim-module-syntax
import enTranslation from "../public/locales/en-US/translation.json" with { type: "json" };

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof enTranslation & typeof arTranslation;
    };
  }
}

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}
