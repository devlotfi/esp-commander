import { useContext, type PropsWithChildren } from "react";
import { SchemaContext } from "../context/schema-context";
import { useDiscoverDevices } from "../hooks/use-dsicover-devices";
import { useQueries } from "@tanstack/react-query";
import type { DeviceSchema } from "../types/device";
import {
  type IOTCQuery,
  type IOTCAction,
  ResponseStatus,
} from "../types/handler-call";
import { deviceSchemasToGeminiFunctions } from "../utils/gemini-schema";
import { mqttQuery } from "../utils/mqtt-query";
import { MqttContext } from "../context/mqtt-context";

export default function SchemaProvider({ children }: PropsWithChildren) {
  const { connectionData } = useContext(MqttContext);
  if (!connectionData) throw new Error("No connection");
  const { devices } = useDiscoverDevices();
  const deviceSchemaQueries = useQueries({
    queries: devices.map((device) => ({
      queryKey: ["SCHEMA", device.id],
      queryFn: async () => {
        const res = await mqttQuery<{
          queries: IOTCQuery[];
          actions: IOTCAction[];
        }>({
          client: connectionData.client,
          requestTopic: device.requestTopic,
          responseTopic: device.responseTopic,
          query: "__SCHEMA__",
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

  const { functions, lookup } = deviceSchemasToGeminiFunctions(
    deviceSchemaQueries
      .map((query) => query.data)
      .filter((item) => item !== undefined),
  );

  return (
    <SchemaContext.Provider
      value={{
        devices,
        functions,
        lookup,
      }}
    >
      {children}
    </SchemaContext.Provider>
  );
}
