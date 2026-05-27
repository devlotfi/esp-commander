import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import SectionHeader from "../components/section-header";
import GeminiSettings from "../components/settings/gemini-settings";
import DisplaySettings from "../components/settings/display-settings";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center p-[1rem]">
      <div className="flex flex-col w-full max-w-screen-lg pb-[5rem]">
        <SectionHeader icon="settings">{t("settings")}</SectionHeader>

        <div className="flex flex-col lg:flex-row gap-[1rem]">
          <div className="flex flex-1 flex-col gap-[1rem]">
            <DisplaySettings></DisplaySettings>
          </div>
          <div className="flex flex-1 flex-col gap-[1rem]">
            <GeminiSettings></GeminiSettings>
          </div>
        </div>
      </div>
    </div>
  );
}
