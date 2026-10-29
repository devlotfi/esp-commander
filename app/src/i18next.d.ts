import "i18next";
import { AppTranslation } from "./types/app-translation";
import type { EN } from "./translation/en";

declare module "i18next" {
  interface CustomTypeOptions {
    resources: {
      translation: typeof EN;
    };
  }
}
