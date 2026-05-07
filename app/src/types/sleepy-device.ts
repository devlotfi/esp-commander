import type {
  ESPCommanderSleepyAction,
  ESPCommanderSleepyQuery,
  HandlerData,
} from "./handler-call";

export interface SleepyDevice {
  id: string;
  name: string;
  commandTopic: string;
  dataTopic: string;
}

export function isSleepyDevice(obj: unknown): obj is SleepyDevice {
  if (typeof obj !== "object" || obj === null) return false;

  const d = obj as Record<string, unknown>;

  return (
    typeof d.id === "string" &&
    typeof d.name === "string" &&
    typeof d.commandTopic === "string" &&
    typeof d.dataTopic === "string"
  );
}

export interface SleepyDeviceSchema extends SleepyDevice {
  query: ESPCommanderSleepyQuery;
  results: HandlerData;
  actions: ESPCommanderSleepyAction[];
}
