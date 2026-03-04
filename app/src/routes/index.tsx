import { Button, Card, Spinner } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useContext, useEffect, useState } from "react";
import { MqttContext } from "../context/mqtt-context";
import { useTranslation } from "react-i18next";
import { Plug } from "lucide-react";
import SectionHeader from "../components/section-header";
import type { Device } from "../types/device";
import { v4 as uuid } from "uuid";
import DeviceComponent from "../components/device-component";
import type { QueryRequest } from "../types/handler-call";
import SearchSVG from "../components/svg/SearchSVG";
import ServerSVG from "../components/svg/ServerSVG";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function DeviceList() {
  const { t } = useTranslation();
  const { connectionData } = useContext(MqttContext);
  if (!connectionData) throw new Error("No connection");

  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    connectionData.client.subscribe(connectionData.info.responseDiscoveryTopic);

    const handleMessage = (_: string, message: Buffer) => {
      try {
        const msg = message.toString();
        const payload: Device = JSON.parse(msg);
        console.log(payload);

        setDevices((devices) => {
          if (devices.find((device) => device.id === payload.id))
            return devices;
          return [...devices.map((device) => ({ ...device })), payload];
        });
      } catch (error) {
        console.error(error);
      }
    };
    connectionData.client.on("message", handleMessage);

    return () => {
      connectionData.client.removeListener("message", handleMessage);
      connectionData.client.unsubscribe(
        connectionData.info.responseDiscoveryTopic,
      );
    };
  }, [connectionData.client, connectionData.info.responseDiscoveryTopic]);

  useEffect(() => {
    const request: QueryRequest = {
      requestId: uuid(),
      query: "__DISCOVERY__",
    };

    connectionData.client.publish(
      connectionData.info.discoveryTopic,
      JSON.stringify(request),
    );
  }, [connectionData.client, connectionData.info.discoveryTopic]);

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="flex flex-1 flex-col max-w-screen-lg w-full">
        <div className="flex justify-between items-center z-10 py-[1rem] px-[2rem]">
          <SectionHeader icon="cpu">{t("devices")}</SectionHeader>
          <Spinner color="accent" size="lg"></Spinner>
        </div>

        {devices.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-[1rem] p-[1rem] pb-[5rem]">
            {devices.map((device, index) => (
              <DeviceComponent
                key={`${device.id}-${index}`}
                device={device}
              ></DeviceComponent>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 text-center justify-center items-center flex-col gap-[1rem] px-[0.5rem]">
            <SearchSVG className="h-[12rem] md:h-[15rem]" />
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
  const { t } = useTranslation();
  const { connectionData } = useContext(MqttContext);
  const navigate = useNavigate();

  if (!connectionData)
    return (
      <div className="flex flex-1 text-center justify-center items-center flex-col gap-[1rem] px-[1rem]">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center items-center flex-col gap-[1rem] px-[0.5rem]">
            <ServerSVG className="h-[12rem]" />
            <div className="flex text-[18pt] font-bold uppercase">
              {t("disconnected")}
            </div>
            <div className="flex text-[13pt] opacity-85">
              {t("connectToMqtt")}
            </div>
          </Card.Content>

          <Card.Footer className="justify-center py-[0.5rem]">
            <Button
              variant="primary"
              style={{
                boxShadow:
                  "color-mix(in srgb, var(--accent), transparent 50%) 0 0 2rem 0",
              }}
              onPress={() => navigate({ to: "/connections" })}
            >
              <Plug></Plug>
              {t("connect")}
            </Button>
          </Card.Footer>
        </Card>
      </div>
    );

  return <DeviceList></DeviceList>;
}
