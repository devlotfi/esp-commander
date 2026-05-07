import type { Device } from "./device";
import type { SleepyDevice } from "./sleepy-device";

export interface RouterContext {
  device?: Device;
  sleepyDevice?: SleepyDevice;
}
