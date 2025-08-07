import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ChainedBackend from "i18next-chained-backend";
import HttpBackend from "i18next-http-backend";
import LocalStorageBackend from "i18next-localstorage-backend";
import { initReactI18next } from "react-i18next";

import type { Module } from "i18next";

const isDevelopment = import.meta.env.MODE === "development";

const httpBackendOptions = {
  loadPath: "/locales/{{lng}}/{{ns}}.json",
};
const localStorageBackendOptions = {
  defaultVersion: "1.0.0",
};

const backends = isDevelopment ? [HttpBackend] : [LocalStorageBackend, HttpBackend];
const backendOptions = isDevelopment
  ? [httpBackendOptions]
  : [localStorageBackendOptions, httpBackendOptions];

await i18n
  .use(ChainedBackend as unknown as Module) // ChainedBackend implements Module but probably version mismatch
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: ["en-US", "ar-EG"],
    supportedLngs: ["en-US", "ar-EG"],
    backend: {
      backends,
      backendOptions,
    },
  });

export default i18n;
