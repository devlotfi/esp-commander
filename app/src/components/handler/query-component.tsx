import { Button, Card, Skeleton, Surface } from "@heroui/react";
import { ResponseStatus, type IOTCQuery } from "../../types/handler-call";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { MqttContext } from "../../context/mqtt-context";
import { useRouteContext } from "@tanstack/react-router";
import ValueRow from "./value-row";
import EmptyHandlerRow from "./empty-handler-row";
import { Braces, RefreshCw, SquareFunction } from "lucide-react";
import { useTranslation } from "react-i18next";
import { mqttQuery } from "../../utils/mqtt-query";
import { sleep } from "../../utils/sleep";

interface QueryComponentProps {
  delay: number;
  query: IOTCQuery;
}

export default function QueryComponent({ query, delay }: QueryComponentProps) {
  const { t } = useTranslation();
  const { connectionData } = useContext(MqttContext);
  const { device } = useRouteContext({ from: "/device" });
  if (!connectionData || !device) throw new Error("Missing data");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["QUERY", query.name],
    queryFn: async () => {
      console.log("fetch");
      await sleep(delay);
      const res = await mqttQuery({
        client: connectionData.client,
        requestTopic: device.requestTopic,
        responseTopic: device.responseTopic,
        query: query.name,
      });

      if (res.status === ResponseStatus.ERROR) throw new Error(res.code);
      console.log("res", res.results);

      return res.results;
    },
  });

  if (isLoading || !data)
    return (
      <Card>
        <Card.Content className="gap-[1rem]">
          <Skeleton className="h-3 w-1/2 rounded-lg" />
          <Skeleton className="h-3 rounded-lg" />
          <Skeleton className="h-3 rounded-lg" />
          <Skeleton className="h-3 rounded-lg" />
        </Card.Content>
      </Card>
    );

  return (
    <Card className="p-[0.5rem] md:p-[1rem]">
      <Card.Content>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.5rem] text-[13pt] font-bold pl-[0.5rem] pb-[0.5rem]">
            <SquareFunction className="size-[13pt]"></SquareFunction>
            <div className="flex">{query.name}</div>
          </div>

          <Button
            isIconOnly
            variant="outline"
            className="bg-[color-mix(in_srgb,var(--surface),transparent_80%)]"
            isPending={isRefetching}
            onPress={() => refetch()}
          >
            <RefreshCw></RefreshCw>
          </Button>
        </div>

        <div className="flex items-center gap-[0.5rem] text-[11pt] pl-[0.5rem] opacity-70">
          <Braces className="size-[13pt]"></Braces>
          <div className="flex">{t("results")}</div>
        </div>
        <Surface className="flex flex-col gap-[0.5rem] p-[0.5rem]">
          {query.results.length ? (
            query.results.map((result, index) => (
              <ValueRow
                key={`${result.name}-${index}`}
                value={result}
                valueData={data[result.name]}
              ></ValueRow>
            ))
          ) : (
            <EmptyHandlerRow></EmptyHandlerRow>
          )}
        </Surface>
      </Card.Content>
    </Card>
  );
}
