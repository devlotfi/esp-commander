import { useContext, useEffect, useState } from "react";
import { MqttContext } from "../context/mqtt-context";
import { isDevice, type Device } from "../types/device";
import { v4 as uuid } from "uuid";
import type { QueryRequest } from "../types/handler-call";

export function useDiscoverDevices() {
  const { connectionData } = useContext(MqttContext);
  if (!connectionData) throw new Error("No connection");

  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    connectionData.client.subscribe(
      connectionData.info.responseDiscoveryTopic,
      {
        qos: 1,
      },
    );

    const handleMessage = (_: string, message: Buffer) => {
      try {
        const msg = message.toString();
        const payload: Device = JSON.parse(msg);
        console.log(payload);
        if (!isDevice(payload)) return;

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

  return {
    devices,
  };
}
