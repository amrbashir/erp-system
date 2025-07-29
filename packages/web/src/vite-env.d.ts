/// <reference types="vite/client" />
/// <reference types="@cloudflare/workers-types/latest" />

import "i18next";

import arTranslation from "../public/locales/ar-Eg/translation.json";
import enTranslation from "../public/locales/en-US/translation.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof enTranslation & typeof arTranslation;
    };
  }
}
