import type { MqttClient } from "mqtt";
import type {
  SleepyDevice,
  SleepyDeviceData,
  SleepyDeviceSchema,
} from "../types/sleepy-device";

export function mqttSleepyQuery({
  client,
  sleepyDevice,
  timeoutMs = 10000,
  signal,
}: {
  client: MqttClient;
  sleepyDevice: SleepyDevice;
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<SleepyDeviceSchema> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      client.off("message", onMessage);
      signal?.removeEventListener("abort", onAbort);

      if (timeout) clearTimeout(timeout);

      // one-shot: unsubscribe when done
      client.unsubscribe(sleepyDevice.dataTopic);
    };

    const finish = (cb: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      cb();
    };

    const onAbort = () => {
      finish(() => reject(new DOMException("Aborted", "AbortError")));
    };

    const onMessage = (topic: string, message: Buffer) => {
      if (topic !== sleepyDevice.dataTopic) return;

      try {
        const payload = JSON.parse(message.toString()) as SleepyDeviceData;

        finish(() =>
          resolve({
            ...payload,
            id: sleepyDevice.id,
            name: sleepyDevice.name,
            commandTopic: sleepyDevice.commandTopic,
            dataTopic: sleepyDevice.dataTopic,
          }),
        );
      } catch {
        // ignore malformed payload
      }
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }

    // Important: wait for active connection
    if (!client.connected) {
      reject(new Error("MQTT client is not connected"));
      return;
    }

    signal?.addEventListener("abort", onAbort);
    client.on("message", onMessage);

    // Important: only start timeout after SUBACK
    client.subscribe(sleepyDevice.dataTopic, { qos: 1 }, (err) => {
      if (err) {
        finish(() => reject(err));
        return;
      }

      timeout = setTimeout(() => {
        finish(() =>
          reject(new Error(`MQTT request timeout (${timeoutMs}ms)`)),
        );
      }, timeoutMs);
    });
  });
}
