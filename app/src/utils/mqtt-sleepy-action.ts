import { v4 as uuid } from "uuid";
import type { MqttClient } from "mqtt";

export async function mqttSleepyAction({
  client,
  commandTopic,
  action,
  parameters,
}: {
  client: MqttClient;
  commandTopic: string;
  action: string;
  parameters: Record<string, unknown>;
}): Promise<void> {
  const requestId = uuid();
  client.publish(
    commandTopic,
    JSON.stringify({
      requestId,
      action,
      parameters,
    }),
    { qos: 1 },
  );
}
