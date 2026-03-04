import { Button, Chip, cn, Popover } from "@heroui/react";
import { Cable, ChevronsLeft, CircleOff, Download, Unplug } from "lucide-react";
import LogoSVG from "../assets/logo.svg";
import { useContext } from "react";
import { AppContext } from "../context/app-context";
import { MqttContext } from "../context/mqtt-context";
import DataRow from "./data-row";
import { useTranslation } from "react-i18next";
import { PWAContext } from "../context/pwa-context";

export default function Navbar() {
  const { t } = useTranslation();
  const { sidebarOpen, setSidebarOpen } = useContext(AppContext);
  const { connectionData, mqttDisconnect } = useContext(MqttContext);
  const { beforeInstallPromptEvent } = useContext(PWAContext);

  return (
    <div className="flex p-0 md:p-[1rem] md:pl-0">
      <div className="flex flex-1 justify-between items-center h-[4rem] px-[0.7rem] rounded-bl-4xl rounded-br-4xl md:rounded-3xl border-b md:border bg-[color-mix(in_srgb,var(--surface),transparent_85%)]">
        <div className="flex items-center gap-[1rem]">
          <Button
            isIconOnly
            variant="outline"
            className="hidden lg:flex bg-[color-mix(in_srgb,var(--surface),transparent_80%)]"
            size="lg"
            onPress={() => setSidebarOpen(!sidebarOpen)}
          >
            <ChevronsLeft
              className={cn(
                "h-[1.5rem] w-[1.5rem] text-foreground duration-300",
                !sidebarOpen && "rotate-180",
              )}
            />
          </Button>
          <img src={LogoSVG} alt="logo" className="h-[3rem] md:h-[3.3rem]" />
          <div className="flex font-bold text-[17pt]">IOT COMMANDER</div>
        </div>

        <div className="flex gap-[0.5rem]">
          {beforeInstallPromptEvent ? (
            <Button
              isIconOnly
              variant="outline"
              className="size-[2.5rem] text-foreground bg-[color-mix(in_srgb,var(--surface),transparent_60%)]"
              onPress={() => beforeInstallPromptEvent.prompt()}
            >
              <Download className="size-[1.4rem]"></Download>
            </Button>
          ) : null}

          <Popover>
            <Button
              isIconOnly
              variant="outline"
              className={cn(
                "size-[2.5rem] text-foreground",
                connectionData
                  ? connectionData.isConnected
                    ? "bg-[color-mix(in_srgb,var(--success),transparent_60%)]"
                    : "bg-[color-mix(in_srgb,var(--danger),transparent_60%)]"
                  : "bg-[color-mix(in_srgb,var(--surface),transparent_60%)]",
              )}
            >
              {connectionData ? (
                connectionData.isConnected ? (
                  <Cable className="size-[1.4rem]"></Cable>
                ) : (
                  <Unplug className="size-[1.4rem]"></Unplug>
                )
              ) : (
                <CircleOff className="size-[1.4rem]"></CircleOff>
              )}
            </Button>

            <Popover.Content className="max-w-64 min-w-64">
              <Popover.Dialog>
                {connectionData ? (
                  connectionData.isConnected ? (
                    <>
                      <Popover.Heading className="flex flex-row justify-between items-center">
                        <Chip color="success" variant="primary">
                          {t("connected")}
                        </Chip>
                        <Button
                          isIconOnly
                          variant="outline"
                          size="lg"
                          className="bg-[color-mix(in_srgb,var(--surface),transparent_80%)]"
                          onPress={() => mqttDisconnect()}
                        >
                          <Unplug className="size-[1.5rem] text-danger-soft-foreground"></Unplug>
                        </Button>
                      </Popover.Heading>
                      <div className="flex flex-col mt-2 text-sm text-muted">
                        <DataRow
                          name={t("name")}
                          value={connectionData.info.name}
                          fold
                        ></DataRow>
                        {connectionData.info.username ? (
                          <DataRow
                            name={t("username")}
                            value={connectionData.info.username}
                            fold
                          ></DataRow>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <>
                      <Popover.Heading className="flex flex-row justify-between items-center">
                        <Chip color="danger" variant="primary">
                          {t("disconnected")}
                        </Chip>
                        <Button
                          isIconOnly
                          variant="outline"
                          size="lg"
                          className="bg-[color-mix(in_srgb,var(--surface),transparent_80%)]"
                          onPress={() => mqttDisconnect()}
                        >
                          <Unplug className="size-[1.5rem] text-danger-soft-foreground"></Unplug>
                        </Button>
                      </Popover.Heading>
                      <div className="flex flex-col mt-2 text-sm text-muted">
                        <DataRow
                          name={t("name")}
                          value={connectionData.info.name}
                          fold
                        ></DataRow>
                        {connectionData.info.username ? (
                          <DataRow
                            name={t("username")}
                            value={connectionData.info.username}
                            fold
                          ></DataRow>
                        ) : null}
                      </div>
                    </>
                  )
                ) : (
                  <>
                    <Popover.Heading className="text-foreground">
                      <Chip
                        color="default"
                        variant="primary"
                        className="text-foreground"
                      >
                        {t("disconnected")}
                      </Chip>
                    </Popover.Heading>
                    <div className="flex flex-col mt-2 text-sm text-muted">
                      {t("notConnected")}
                    </div>
                  </>
                )}
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        </div>
      </div>
    </div>
  );
}
