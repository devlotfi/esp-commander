import { v4 as uuid } from "uuid";
import {
  type HandlerData,
  type ActionRequest,
  type HandlerResponse,
} from "../types/handler-call";
import type { MqttClient } from "mqtt";

export function mqttAction<T = HandlerData>({
  client,
  requestTopic,
  responseTopic,
  action,
  parameters,
  timeoutMs = 10000,
}: {
  client: MqttClient;
  requestTopic: string;
  responseTopic: string;
  action: string;
  parameters: HandlerData;
  timeoutMs?: number;
}): Promise<HandlerResponse<T>> {
  return new Promise((resolve, reject) => {
    const requestId = uuid();
    let finished = false;

    const cleanup = () => {
      if (finished) return;
      finished = true;

      clearTimeout(timeout);
      client.removeListener("message", handler);
      client.unsubscribe(responseTopic);
    };

    const handler = (_topic: string, message: Buffer) => {
      try {
        const payload = JSON.parse(message.toString());

        if (payload.requestId !== requestId) return;

        cleanup();

        if (payload.status === "ERROR") {
          reject(payload);
        } else {
          resolve(payload);
        }
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`MQTT request timeout (${timeoutMs}ms)`));
    }, timeoutMs);

    client.on("message", handler);

    // Wait for subscribe to succeed before publishing
    client.subscribe(
      responseTopic,
      {
        qos: 1,
      },
      (err: Error | null) => {
        if (err) {
          cleanup();
          reject(err);
          return;
        }

        client.publish(
          requestTopic,
          JSON.stringify({
            requestId,
            action,
            parameters,
          } as ActionRequest),
        );
      },
    );
  });
}
