import type { ESPCommanderAction, ESPCommanderQuery } from "./handler-call";

export interface Device {
  id: string;
  name: string;
  requestTopic: string;
  responseTopic: string;
}

export function isDevice(obj: unknown): obj is Device {
  if (typeof obj !== "object" || obj === null) return false;

  const d = obj as Record<string, unknown>;

  return (
    typeof d.id === "string" &&
    typeof d.name === "string" &&
    typeof d.requestTopic === "string" &&
    typeof d.responseTopic === "string"
  );
}

export interface DeviceSchema extends Device {
  queries: ESPCommanderQuery[];
  actions: ESPCommanderAction[];
}
