import mqtt from "mqtt";
import { createContext, type SetStateAction } from "react";
import type { ConnectionDocType } from "../rxdb/connection";

export interface ConnectionData {
  client: mqtt.MqttClient;
  isConnected: boolean;
  info: ConnectionDocType;
}

export function copyConnectionData(
  connectionData: ConnectionData,
): ConnectionData {
  return {
    ...connectionData,
    info: {
      id: connectionData.info.id,
      name: connectionData.info.name,
      url: connectionData.info.url,
      username: connectionData.info.username,
      password: connectionData.info.password,
      discoveryTopic: connectionData.info.discoveryTopic,
      responseDiscoveryTopic: connectionData.info.responseDiscoveryTopic,
      sleepyDeviceDiscoveryTopic:
        connectionData.info.sleepyDeviceDiscoveryTopic,
      sleepyDeviceResponseDiscoveryTopic:
        connectionData.info.sleepyDeviceResponseDiscoveryTopic,
    },
  };
}

interface MqttContext {
  connectionData: ConnectionData | null;
  setConnectionData: (value: SetStateAction<ConnectionData | null>) => void;
  mqttConnect: (connection: ConnectionDocType, password?: string) => void;
  mqttDisconnect: () => void;
}

export const MqttContextInitialValue: MqttContext = {
  connectionData: null,
  setConnectionData() {},
  mqttConnect() {},
  mqttDisconnect() {},
};

export const MqttContext = createContext(MqttContextInitialValue);
