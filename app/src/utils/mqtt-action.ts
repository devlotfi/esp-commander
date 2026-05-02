import { v4 as uuid } from "uuid";
import type { MqttClient } from "mqtt";
import type { HandlerData, HandlerResponse } from "../types/handler-call";

export function mqttAction<T = HandlerData>({
  client,
  requestTopic,
  responseTopic,
  action,
  parameters,
  timeoutMs = 10000,
  signal,
}: {
  client: MqttClient;
  requestTopic: string;
  responseTopic: string;
  action: string;
  parameters: Record<string, unknown>;
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<HandlerResponse<T>> {
  return new Promise((resolve, reject) => {
    const requestId = uuid();
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;

      clearTimeout(timeout);
      client.off("message", handler);

      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }

      fn();
    };

    const onAbort = () => {
      finish(() => reject(new DOMException("Aborted", "AbortError")));
    };

    const handler = (topic: string, message: Buffer) => {
      if (topic !== responseTopic) return;

      let payload;

      try {
        payload = JSON.parse(message.toString());
      } catch {
        return;
      }

      if (payload.requestId !== requestId) return;

      if (payload.status === "ERROR") {
        finish(() => reject(payload));
      } else {
        finish(() => resolve(payload));
      }
    };

    const timeout = setTimeout(() => {
      finish(() => reject(new Error(`Timeout after ${timeoutMs}ms`)));
    }, timeoutMs);

    if (signal?.aborted) {
      onAbort();
      return;
    }

    signal?.addEventListener("abort", onAbort);

    client.on("message", handler);

    client.subscribe(responseTopic, { qos: 1 }, (subErr) => {
      if (subErr) {
        finish(() => reject(subErr));
        return;
      }

      client.publish(
        requestTopic,
        JSON.stringify({
          requestId,
          action,
          parameters,
        }),
        { qos: 1 },
        (pubErr) => {
          if (pubErr) {
            finish(() => reject(pubErr));
          }
        },
      );
    });
  });
}
