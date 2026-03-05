import {
  Button,
  Card,
  cn,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  Label,
  ListBox,
  Select,
} from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import ArSVG from "../assets/flags/ar.svg";
import FrSVG from "../assets/flags/fr.svg";
import EnSVG from "../assets/flags/en.svg";
import {
  ThemeContext,
  ThemeContextInitialValue,
} from "../context/theme-context";
import { ThemeOptions } from "../types/theme-options";
import { Computer, Moon, RotateCcw, Sun } from "lucide-react";
import SectionHeader from "../components/section-header";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const { themeOption, setTheme, accentColor, applyAccentColor } =
    useContext(ThemeContext);
  const { t, i18n } = useTranslation();

  const renderFlag = (languageCode: string, className?: string) => {
    switch (languageCode) {
      case "ar":
        return (
          <img
            src={ArSVG}
            alt="ar"
            className={cn("h-[1.5rem]", className)}
          ></img>
        );
      case "fr":
        return (
          <img
            src={FrSVG}
            alt="fr"
            className={cn("h-[1.5rem]", className)}
          ></img>
        );
      case "en":
        return (
          <img
            src={EnSVG}
            alt="eb"
            className={cn("h-[1.5rem]", className)}
          ></img>
        );
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center p-[1rem]">
      <div className="flex flex-col w-full max-w-screen-sm pt-[2rem]">
        <SectionHeader icon="settings">{t("settings")}</SectionHeader>

        <Card>
          <Card.Content className="flex flex-col gap-[0.7rem]">
            <Select
              value={themeOption}
              onChange={(value) => setTheme(value?.toString() as ThemeOptions)}
            >
              <Label>{t("theme")}</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item
                    key={ThemeOptions.SYSTEM}
                    id={ThemeOptions.SYSTEM}
                    textValue={t("system")}
                  >
                    <div className="flex gap-[1rem] items-center">
                      <div className="flex justify-center items-center h-[2rem] w-[2rem] bg-accent rounded-2xl">
                        <Computer className="text-accent-foreground"></Computer>
                      </div>
                      <div className="flex">{t("system")}</div>
                    </div>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item
                    key={ThemeOptions.LIGHT}
                    id={ThemeOptions.LIGHT}
                    textValue={t("light")}
                  >
                    <div className="flex gap-[1rem] items-center">
                      <div className="flex justify-center items-center h-[2rem] w-[2rem] bg-accent rounded-2xl">
                        <Sun className="text-accent-foreground"></Sun>
                      </div>
                      <div className="flex">{t("light")}</div>
                    </div>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item
                    key={ThemeOptions.DARK}
                    id={ThemeOptions.DARK}
                    textValue={t("dark")}
                  >
                    <div className="flex gap-[1rem] items-center">
                      <div className="flex justify-center items-center h-[2rem] w-[2rem] bg-accent rounded-2xl">
                        <Moon className="text-accent-foreground"></Moon>
                      </div>
                      <div className="flex">{t("dark")}</div>
                    </div>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>

            <ColorField
              aria-label="color"
              fullWidth
              value={accentColor}
              onChange={(value) => {
                if (value) {
                  applyAccentColor(value.toString("hex"));
                }
              }}
            >
              <Label>{t("accentColor")}</Label>
              <div className="flex items-center gap-[0.5rem]">
                <ColorField.Group className="h-[3rem] flex-1">
                  <ColorField.Prefix>
                    <ColorPicker
                      value={accentColor}
                      onChange={(value) => {
                        if (value) {
                          applyAccentColor(value.toString("hex"));
                        }
                      }}
                    >
                      <ColorPicker.Trigger>
                        <ColorSwatch size="sm" />
                      </ColorPicker.Trigger>
                      <ColorPicker.Popover className="gap-2">
                        <ColorArea
                          aria-label="Color area"
                          className="max-w-full"
                          colorSpace="hsb"
                          xChannel="saturation"
                          yChannel="brightness"
                        >
                          <ColorArea.Thumb />
                        </ColorArea>

                        <ColorSlider
                          aria-label="Hue slider"
                          channel="hue"
                          className="flex-1"
                          colorSpace="hsb"
                        >
                          <ColorSlider.Track>
                            <ColorSlider.Thumb />
                          </ColorSlider.Track>
                        </ColorSlider>
                      </ColorPicker.Popover>
                    </ColorPicker>
                  </ColorField.Prefix>
                  <ColorField.Input />
                </ColorField.Group>

                <Button
                  isIconOnly
                  variant="outline"
                  size="lg"
                  onPress={() =>
                    applyAccentColor(ThemeContextInitialValue.accentColor)
                  }
                >
                  <RotateCcw></RotateCcw>
                </Button>
              </div>
            </ColorField>

            <Select
              value={i18n.language}
              onChange={(value) => i18n.changeLanguage(value?.toString())}
            >
              <Label>{t("language")}</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item key={"ar"} id={"ar"} textValue={"العربية"}>
                    <div className="flex gap-[1rem] items-center">
                      <div className="flex justify-center items-center h-[2rem] w-[2rem] rounded-lg">
                        {renderFlag("ar")}
                      </div>
                      <div className="flex">العربية</div>
                    </div>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item key={"fr"} id={"fr"} textValue={"Français"}>
                    <div className="flex gap-[1rem] items-center">
                      <div className="flex justify-center items-center h-[2rem] w-[2rem] rounded-lg">
                        {renderFlag("fr")}
                      </div>
                      <div className="flex">Français</div>
                    </div>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item key={"en"} id={"en"} textValue={"English"}>
                    <div className="flex gap-[1rem] items-center">
                      <div className="flex justify-center items-center h-[2rem] w-[2rem] rounded-lg">
                        {renderFlag("en")}
                      </div>
                      <div className="flex">English</div>
                    </div>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
