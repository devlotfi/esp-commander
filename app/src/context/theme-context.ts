import { createContext } from "react";
import type { AppliedThemes } from "../types/applied-theme";
import { ThemeOptions } from "../types/theme-options";

interface ThemeContext {
  themeOption: ThemeOptions;
  appliedTheme: AppliedThemes;
  accentColor: string;
  setTheme: (theme: ThemeOptions) => void;
  applyAccentColor: (accentColor: string) => void;
}

export const ThemeContextInitialValue: ThemeContext = {
  themeOption: ThemeOptions.SYSTEM,
  appliedTheme: ThemeOptions.LIGHT,
  accentColor: "#e16349",
  setTheme() {},
  applyAccentColor() {},
};

export const ThemeContext = createContext(ThemeContextInitialValue);
