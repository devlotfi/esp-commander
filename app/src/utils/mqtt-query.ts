import { v4 as uuid } from "uuid";
import {
  type HandlerData,
  type HandlerResponse,
  type QueryRequest,
} from "../types/handler-call";
import type { MqttClient } from "mqtt";

export function mqttQuery<T = HandlerData>({
  client,
  requestTopic,
  responseTopic,
  query,
  timeoutMs = 5000,
  signal,
}: {
  client: MqttClient;
  requestTopic: string;
  responseTopic: string;
  query: string;
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
      // Ignore messages from other topics
      if (topic !== responseTopic) return;

      let payload: HandlerResponse<T>;

      // Ignore malformed/unrelated payloads
      try {
        payload = JSON.parse(message.toString());
      } catch {
        return;
      }

      // Ignore responses for other requests
      if (payload.requestId !== requestId) return;

      if (payload.status === "ERROR") {
        finish(() => reject(payload));
      } else {
        finish(() => resolve(payload));
      }
    };

    const timeout = setTimeout(() => {
      finish(() => reject(new Error(`MQTT request timeout (${timeoutMs}ms)`)));
    }, timeoutMs);

    // Handle already-aborted signals
    if (signal?.aborted) {
      onAbort();
      return;
    }

    signal?.addEventListener("abort", onAbort);

    client.on("message", handler);

    client.subscribe(responseTopic, { qos: 1 }, (subErr: Error | null) => {
      if (subErr) {
        finish(() => reject(subErr));
        return;
      }

      client.publish(
        requestTopic,
        JSON.stringify({
          requestId,
          query,
        } as QueryRequest),
        { qos: 1 },
        (pubErr?: Error) => {
          if (pubErr) {
            finish(() => reject(pubErr));
          }
        },
      );
    });
  });
}
