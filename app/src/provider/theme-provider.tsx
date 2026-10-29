import { type PropsWithChildren, useEffect, useState } from "react";
import type { AppliedThemes } from "../types/applied-theme";
import { ThemeContextInitialValue } from "../context/theme-context";
import { ThemeOptions } from "../types/theme-options";
import { ThemeContext } from "../context/theme-context";
import { Constants } from "../constants";
import { useMediaQuery } from "@heroui/react";

const getSystemTheme = (): AppliedThemes => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return ThemeOptions.DARK;
  }
  return ThemeOptions.LIGHT;
};

const initThemeOption = (): ThemeOptions => {
  const theme = localStorage.getItem(Constants.THEME_STORAGE_KEY);
  if (
    theme === ThemeOptions.LIGHT ||
    theme === ThemeOptions.DARK ||
    theme === ThemeOptions.SYSTEM
  ) {
    return theme;
  }
  return ThemeOptions.SYSTEM;
};
const initAppliedTheme = (): AppliedThemes => {
  const theme = localStorage.getItem(Constants.THEME_STORAGE_KEY);
  if (theme === ThemeOptions.SYSTEM) {
    return getSystemTheme();
  } else if (theme === ThemeOptions.LIGHT || theme === ThemeOptions.DARK) {
    return theme;
  } else {
    return ThemeOptions.LIGHT;
  }
};
const initAccentColor = (): string => {
  const accentColor = localStorage.getItem(Constants.ACCENT_COLOR_STORAGE_KEY);
  document.documentElement.style.setProperty("--accent", accentColor);
  return accentColor || ThemeContextInitialValue.accentColor;
};

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themeOption, setThemeOption] =
    useState<ThemeOptions>(initThemeOption());
  const [appliedTheme, setAppliedTheme] =
    useState<AppliedThemes>(initAppliedTheme());
  const [accentColor, setAccentColor] = useState<string>(initAccentColor());
  const isLarge = useMediaQuery("(min-width: 768px)");

  const applyTheme = (theme: ThemeOptions) => {
    const element = document.getElementById("theme-provider") as HTMLElement;
    if (theme === ThemeOptions.DARK || theme === ThemeOptions.LIGHT) {
      element.className = `bg-background text-foreground ${
        theme === ThemeOptions.LIGHT ? "light" : "dark"
      }`;
      element.dataset.theme = element.dataset.theme =
        theme === ThemeOptions.LIGHT ? "light" : "dark";
      setAppliedTheme(theme);
    } else if (theme === ThemeOptions.SYSTEM) {
      const systemTheme = getSystemTheme();
      if (
        systemTheme === ThemeOptions.LIGHT ||
        systemTheme === ThemeOptions.DARK
      ) {
        element.className = `bg-background text-foreground ${
          systemTheme === ThemeOptions.LIGHT ? "light" : "dark"
        }`;
        element.dataset.theme =
          systemTheme === ThemeOptions.LIGHT ? "light" : "dark";
        setAppliedTheme(systemTheme);
      }
    }
    localStorage.setItem(Constants.THEME_STORAGE_KEY, theme);
  };

  const applyAccentColor = (accentColor: string) => {
    document.documentElement.style.setProperty("--accent", accentColor);
    setAccentColor(accentColor);
    localStorage.setItem(Constants.ACCENT_COLOR_STORAGE_KEY, accentColor);
  };

  useEffect(() => {
    applyTheme(themeOption);
  }, [themeOption]);

  useEffect(() => {
    const metaTag = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!metaTag) return;
    switch (appliedTheme) {
      case ThemeOptions.LIGHT:
        if (isLarge) {
          metaTag.setAttribute("content", "#d4d8de");
        } else {
          metaTag.setAttribute("content", "#eaecef");
        }
        break;
      case ThemeOptions.DARK:
        if (isLarge) {
          metaTag.setAttribute("content", "#202733");
        } else {
          metaTag.setAttribute("content", "#262d3b");
        }
        break;
    }
  }, [appliedTheme, isLarge]);

  useEffect(() => {
    const handler = () => {
      setThemeOption((theme) => {
        if (theme === ThemeOptions.SYSTEM) {
          applyTheme(getSystemTheme());
        }
        return theme;
      });
    };

    const themeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    themeMediaQuery.addEventListener("change", handler);

    return () => {
      themeMediaQuery.removeEventListener("change", handler);
    };
  }, [themeOption]);

  return (
    <ThemeContext.Provider
      value={{
        themeOption: themeOption,
        appliedTheme: appliedTheme,
        accentColor: accentColor,
        setTheme: setThemeOption,
        applyAccentColor: applyAccentColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
