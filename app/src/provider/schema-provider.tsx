import { useContext, type PropsWithChildren } from "react";
import { SchemaContext } from "../context/schema-context";
import { useDiscoverDevices } from "../hooks/use-dsicover-devices";
import { useQueries } from "@tanstack/react-query";
import type { DeviceSchema } from "../types/device";
import {
  type ESPCommanderQuery,
  type ESPCommanderAction,
  ResponseStatus,
} from "../types/handler-call";
import {
  deviceSchemasToGeminiFunctions,
  sleepyDeviceSchemasToGeminiFunctions,
} from "../utils/gemini-schema";
import { mqttQuery } from "../utils/mqtt-query";
import { MqttContext } from "../context/mqtt-context";
import { useDiscoverSleepyDevices } from "../hooks/use-dsicover-sleepy-devices";
import { mqttSleepyQuery } from "../utils/mqtt-sleepy-query";

export default function SchemaProvider({ children }: PropsWithChildren) {
  const { connectionData } = useContext(MqttContext);
  if (!connectionData) throw new Error("No connection");

  const { devices } = useDiscoverDevices();
  const { sleepyDevices } = useDiscoverSleepyDevices();

  const deviceSchemaQueries = useQueries({
    queries: devices.map((device) => ({
      queryKey: ["SCHEMA", device.id],
      queryFn: async ({ signal }) => {
        const res = await mqttQuery<{
          queries: ESPCommanderQuery[];
          actions: ESPCommanderAction[];
        }>({
          client: connectionData.client,
          requestTopic: device.requestTopic,
          responseTopic: device.responseTopic,
          query: "__SCHEMA__",
          signal,
        });
        console.log("res", res);

        if (res.status === ResponseStatus.ERROR) throw new Error(res.code);

        return {
          id: device.id,
          name: device.name,
          requestTopic: device.requestTopic,
          responseTopic: device.responseTopic,
          ...res.results,
        } as DeviceSchema;
      },
    })),
  });

  const sleepyDeviceSchemaQueries = useQueries({
    queries: sleepyDevices.map((sleepyDevice) => ({
      queryKey: ["SLEEPY_SCHEMA", sleepyDevice.id],
      queryFn: async ({ signal }) => {
        const res = await mqttSleepyQuery({
          client: connectionData.client,
          sleepyDevice,
          signal,
        });
        console.log("res", res);

        return res;
      },
    })),
  });

  const deviceGeminiData = deviceSchemasToGeminiFunctions(
    deviceSchemaQueries
      .map((query) => query.data)
      .filter((item) => item !== undefined),
  );
  const sleepyDeviceGeminiData = sleepyDeviceSchemasToGeminiFunctions(
    sleepyDeviceSchemaQueries
      .map((query) => query.data)
      .filter((item) => item !== undefined),
  );

  return (
    <SchemaContext.Provider
      value={{
        devices,
        sleepyDevices,
        functions: [
          ...deviceGeminiData.functions,
          ...sleepyDeviceGeminiData.functions,
        ],
        lookup: new Map([
          ...deviceGeminiData.lookup,
          ...sleepyDeviceGeminiData.lookup,
        ]),
      }}
    >
      {children}
    </SchemaContext.Provider>
  );
}
