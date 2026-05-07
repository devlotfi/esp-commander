import { useContext, useEffect, useState, useCallback } from "react";
import { MqttContext } from "../context/mqtt-context";
import {
  type SleepyDevice,
  type SleepyDeviceData,
  type SleepyDeviceSchema,
} from "../types/sleepy-device";

export function useSleepyDeviceQuery(sleepyDevice: SleepyDevice) {
  const { connectionData } = useContext(MqttContext);
  if (!connectionData) throw new Error("No connection");

  const [sleepyDeviceData, setSleepyDeviceData] =
    useState<SleepyDeviceData | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    connectionData.client.subscribe(sleepyDevice.dataTopic, {
      qos: 1,
    });

    const handleMessage = (topic: string, message: Buffer) => {
      if (topic !== sleepyDevice.dataTopic) return;

      try {
        const payload: SleepyDeviceSchema = JSON.parse(message.toString());

        console.log(payload);
        setSleepyDeviceData(payload);
      } catch (error) {
        console.error(error);
      }
    };

    connectionData.client.on("message", handleMessage);

    return () => {
      connectionData.client.removeListener("message", handleMessage);
      connectionData.client.unsubscribe(sleepyDevice.dataTopic);
    };
  }, [connectionData, sleepyDevice.dataTopic, refreshKey]);

  return {
    sleepyDeviceData: sleepyDeviceData
      ? ({
          ...sleepyDeviceData,
          id: sleepyDevice.id,
          name: sleepyDevice.name,
          commandTopic: sleepyDevice.commandTopic,
          dataTopic: sleepyDevice.dataTopic,
        } satisfies SleepyDeviceSchema)
      : null,
    refetch,
  };
}
