/// <reference types="vite/client" />

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
