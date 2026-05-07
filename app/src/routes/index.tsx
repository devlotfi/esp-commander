import { Spinner } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import SectionHeader from "../components/section-header";
import SearchSVG from "../components/svg/SearchSVG";
import RequiredConnectionProvider from "../provider/required-connection-provider";
import { useDiscoverDevices } from "../hooks/use-dsicover-devices";
import { useDiscoverSleepyDevices } from "../hooks/use-dsicover-sleepy-devices";
import DeviceComponent from "../components/device/device-component";
import SleepyDeviceComponent from "../components/device/sleepy-device-component";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function DeviceList() {
  const { t } = useTranslation();
  const { devices } = useDiscoverDevices();
  const { sleepyDevices } = useDiscoverSleepyDevices();

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="flex flex-1 flex-col max-w-screen-lg w-full pb-[5rem]">
        <div className="flex justify-between items-center z-10 px-[2rem]">
          <SectionHeader icon="cpu">{t("devices")}</SectionHeader>
          <div
            className="hidden md:flex flex-1 h-[1px]"
            style={{
              backgroundImage:
                "linear-gradient(to right, transparent, var(--separator), transparent)",
            }}
          ></div>
          <Spinner color="accent" size="lg"></Spinner>
        </div>

        {devices.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1rem] p-[1rem]">
            {devices.map((device, index) => (
              <DeviceComponent
                key={`${device.id}-${index}`}
                device={device}
              ></DeviceComponent>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 text-center justify-center items-center flex-col gap-[1rem] px-[0.5rem]">
            <SearchSVG className="h-[12rem]" />
            <div className="flex text-[18pt] font-bold uppercase">
              {t("searching")}...
            </div>
          </div>
        )}

        <div className="flex justify-between items-center z-10 px-[2rem]">
          <SectionHeader icon="moon">{t("sleepyDevices")}</SectionHeader>
          <div
            className="hidden md:flex flex-1 h-[1px]"
            style={{
              backgroundImage:
                "linear-gradient(to right, transparent, var(--separator), transparent)",
            }}
          ></div>
          <Spinner color="accent" size="lg"></Spinner>
        </div>

        {sleepyDevices.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1rem] p-[1rem]">
            {sleepyDevices.map((sleepyDevice, index) => (
              <SleepyDeviceComponent
                key={`${sleepyDevice.id}-${index}`}
                sleepyDevice={sleepyDevice}
              ></SleepyDeviceComponent>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 text-center justify-center items-center flex-col gap-[1rem] px-[0.5rem]">
            <SearchSVG className="h-[12rem]" />
            <div className="flex text-[18pt] font-bold uppercase">
              {t("searching")}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RouteComponent() {
  return (
    <RequiredConnectionProvider>
      <DeviceList></DeviceList>
    </RequiredConnectionProvider>
  );
}
