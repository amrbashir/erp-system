import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ChainedBackend from "i18next-chained-backend";
import HttpBackend from "i18next-http-backend";
import LocalStorageBackend from "i18next-localstorage-backend";
import { initReactI18next } from "react-i18next";

const isDevelopment = import.meta.env.MODE === "development";
const backends = isDevelopment ? [HttpBackend] : [LocalStorageBackend, HttpBackend];

await i18n
  .use(ChainedBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: ["en-US", "ar-EG"],
    backend: {
      backends,
      backendOptions: [
        {
          expirationTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        },
        {
          loadPath: "/locales/{{lng}}/{{ns}}.json",
        },
      ],
    },
  });

export default i18n;
