import { useContext, useEffect, useState } from "react";
import { MqttContext } from "../context/mqtt-context";
import { v4 as uuid } from "uuid";
import type { QueryRequest } from "../types/handler-call";
import { isSleepyDevice, type SleepyDevice } from "../types/sleepy-device";

export function useDiscoverSleepyDevices() {
  const { connectionData } = useContext(MqttContext);
  if (!connectionData) throw new Error("No connection");

  const [sleepyDevices, setSleepyDevices] = useState<SleepyDevice[]>([]);

  useEffect(() => {
    if (
      !connectionData.info.sleepyDeviceDiscoveryTopic ||
      !connectionData.info.sleepyDeviceResponseDiscoveryTopic
    )
      return;
    connectionData.client.subscribe(
      connectionData.info.sleepyDeviceResponseDiscoveryTopic,
      {
        qos: 1,
      },
    );

    const handleMessage = (_: string, message: Buffer) => {
      try {
        const msg = message.toString();
        const payload: SleepyDevice = JSON.parse(msg);
        console.log(payload);
        if (!isSleepyDevice(payload)) return;

        setSleepyDevices((sleepyDevices) => {
          if (
            sleepyDevices.find((sleepyDevice) => sleepyDevice.id === payload.id)
          )
            return sleepyDevices;
          return [
            ...sleepyDevices.map((sleepyDevice) => ({ ...sleepyDevice })),
            payload,
          ];
        });
      } catch (error) {
        console.error(error);
      }
    };
    connectionData.client.on("message", handleMessage);

    return () => {
      if (
        !connectionData.info.sleepyDeviceDiscoveryTopic ||
        !connectionData.info.sleepyDeviceResponseDiscoveryTopic
      )
        return;
      connectionData.client.removeListener("message", handleMessage);
      connectionData.client.unsubscribe(
        connectionData.info.sleepyDeviceResponseDiscoveryTopic,
      );
    };
  }, [
    connectionData.client,
    connectionData.info.sleepyDeviceResponseDiscoveryTopic,
  ]);

  useEffect(() => {
    if (
      !connectionData.info.sleepyDeviceDiscoveryTopic ||
      !connectionData.info.sleepyDeviceResponseDiscoveryTopic
    )
      return;
    const request: QueryRequest = {
      requestId: uuid(),
      query: "__DISCOVERY__",
    };

    connectionData.client.publish(
      connectionData.info.sleepyDeviceDiscoveryTopic,
      JSON.stringify(request),
    );
  }, [connectionData.client, connectionData.info.sleepyDeviceDiscoveryTopic]);

  return {
    sleepyDevices,
  };
}
