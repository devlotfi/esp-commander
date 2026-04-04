import { useContext, useEffect, useState } from "react";
import { MqttContext } from "../../context/mqtt-context";
import { ResponseStatus, type HandlerData } from "../../types/handler-call";
import { useQueries } from "@tanstack/react-query";
import { mqttQuery } from "../../utils/mqtt-query";
import { type FunctionMeta } from "../../utils/gemini-schema";
import { Avatar, Card, Spinner, Table } from "@heroui/react";
import { type Content } from "@google/genai";
import { BrainCircuit, Check, CircleX } from "lucide-react";
import type { Device } from "../../types/device";
import { mqttAction } from "../../utils/mqtt-action";
import type { ModelResponseData } from "../../types/model-response-data";
import { sleep } from "../../utils/sleep";

export default function ModelMessage({
  content,
  lookup,
  devices,
  respondToModel,
}: {
  content: Content;
  lookup: Map<string, FunctionMeta>;
  devices: Device[];
  respondToModel: (data: ModelResponseData[]) => void;
}) {
  const { connectionData } = useContext(MqttContext);
  if (!connectionData) throw new Error("Missing data");

  const functionCalls =
    content.parts
      ?.filter((part) => part.functionCall !== undefined)
      .map((part) => part.functionCall!) || [];
  const functionCallsQueries = useQueries({
    queries: functionCalls.map((functionCall, index) => ({
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      queryKey: ["FUNCTION_CALL", functionCall.id],
      queryFn: async (): Promise<ModelResponseData | null> => {
        if (!functionCall.name) return null;
        const originalFunction = lookup.get(functionCall.name);
        if (!originalFunction) return null;
        const device = devices.find(
          (device) => device.id === originalFunction.deviceId,
        );
        if (!device) return null;

        await sleep(index * 300);
        console.log("function call", functionCall);
        console.log("function original", lookup.get(functionCall.name));

        if (originalFunction.type === "query") {
          console.log("query");
          const res = await mqttQuery({
            client: connectionData.client,
            requestTopic: device.requestTopic,
            responseTopic: device.responseTopic,
            query: originalFunction.originalName,
          });
          if (res.status === ResponseStatus.ERROR) throw new Error(res.code);
          if (Object.keys(res.results).length > 0) {
            return {
              functionCall,
              originalFunction,
              data: res.results,
            };
          } else {
            return {
              functionCall,
              originalFunction,
              data: { status: "success" },
            };
          }
        } else if (originalFunction.type === "action") {
          console.log("action");
          const res = await mqttAction({
            client: connectionData.client,
            requestTopic: device.requestTopic,
            responseTopic: device.responseTopic,
            action: originalFunction.originalName,
            parameters: functionCall.args as HandlerData,
          });
          if (res.status === ResponseStatus.ERROR) throw new Error(res.code);
          if (Object.keys(res.results).length > 0) {
            return {
              functionCall,
              originalFunction,
              data: res.results,
            };
          } else {
            return {
              functionCall,
              originalFunction,
              data: { status: "success" },
            };
          }
        }

        return null;
      },
    })),
  });

  const [completed, setCompleted] = useState<boolean>(false);

  useEffect(() => {
    const allFinished = functionCallsQueries.every(
      (q) => q.status === "success" || q.status === "error",
    );

    if (allFinished && !completed && functionCallsQueries.length) {
      setCompleted(true);
      const data = functionCallsQueries
        .filter(
          (q) =>
            q.status === "success" && q.data !== undefined && q.data !== null,
        )
        .map((q) => q.data as ModelResponseData);
      console.log("All queries completed:", data);
      respondToModel(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [functionCallsQueries]);

  return (
    content.parts?.map((part, index) => {
      const functionCallQuery = functionCallsQueries[index];

      return (
        <div
          key={index}
          className="flex items-center justify-start gap-[0.5rem]"
        >
          <Avatar color="accent">
            <Avatar.Fallback>
              <BrainCircuit></BrainCircuit>
            </Avatar.Fallback>
          </Avatar>

          <Card className="p-[0.5rem]">
            <Card.Content>
              {part.text ? <div className="flex">{part.text}</div> : null}

              {part.functionCall ? (
                <div className="flex flex-col gap-[0.5rem]">
                  <div className="flex justify-between gap-[2rem]">
                    <div className="flex items-center gap-[0.5rem] px-[0.5rem]">
                      <div className="flex">Calling: </div>
                      <div className="text-accent font-bold">
                        {part.functionCall.name
                          ? lookup.get(part.functionCall.name)?.originalName
                          : null}
                      </div>
                    </div>
                    {functionCallQuery.status === "pending" ? (
                      <Spinner size="md"></Spinner>
                    ) : functionCallQuery.status === "success" ? (
                      <Check className="text-success"></Check>
                    ) : functionCallQuery.status === "error" ? (
                      <CircleX className="text-danger"></CircleX>
                    ) : null}
                  </div>

                  {part.functionCall.args &&
                  Object.keys(part.functionCall.args).length > 1 ? (
                    <Table>
                      <Table.Content aria-label="args">
                        <Table.Header>
                          <Table.Column isRowHeader>Name</Table.Column>
                          <Table.Column>Value</Table.Column>
                        </Table.Header>
                        <Table.Body>
                          {Object.keys(part.functionCall.args)
                            .filter((argKey) => argKey !== "deviceId")
                            .map((argKey) => (
                              <Table.Row>
                                <Table.Cell>{argKey}</Table.Cell>
                                <Table.Cell>
                                  {JSON.stringify(
                                    part.functionCall?.args
                                      ? part.functionCall.args[argKey]
                                      : null,
                                  )}
                                </Table.Cell>
                              </Table.Row>
                            ))}
                        </Table.Body>
                      </Table.Content>
                    </Table>
                  ) : null}
                </div>
              ) : null}
            </Card.Content>
          </Card>
        </div>
      );
    }) || null
  );
}
