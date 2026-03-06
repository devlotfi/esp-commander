import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useContext } from "react";
import { MqttContext } from "../context/mqtt-context";
import { Card, Tabs } from "@heroui/react";
import DataRow from "../components/data-row";
import {
  ResponseStatus,
  type IOTCAction,
  type IOTCQuery,
} from "../types/handler-call";
import { useQuery } from "@tanstack/react-query";
import LoadingScreen from "../components/loading-screen";
import { useTranslation } from "react-i18next";
import { mqttQuery } from "../utils/mqtt-query";
import QueryComponent from "../components/handler/query-component";
import ActionComponent from "../components/handler/action-component";
import EmptySVG from "../components/svg/EmptySVG";
import ChipSVG from "../components/svg/ChipSVG";

export const Route = createFileRoute("/device")({
  component: RouteComponent,
});

function EmptyList() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-[1rem] items-center py-[3rem]">
      <EmptySVG className="h-[10rem]" />
      <div className="flex uppercase font-bold text-[20pt]">{t("empty")}</div>
    </div>
  );
}

function DeviceSchema() {
  const { t } = useTranslation();
  const { connectionData } = useContext(MqttContext);
  const { device } = Route.useRouteContext();
  if (!connectionData || !device) throw new Error("Missing data");

  const { data, isLoading } = useQuery({
    queryKey: ["SCHEMA", device.id],
    queryFn: async () => {
      const res = await mqttQuery<{
        queries: IOTCQuery[];
        actions: IOTCAction[];
      }>({
        client: connectionData.client,
        requestTopic: device.requestTopic,
        responseTopic: device.responseTopic,
        query: "__SCHEMA__",
      });
      console.log("res", res);

      if (res.status === ResponseStatus.ERROR) throw new Error(res.code);

      return res.results;
    },
  });

  if (isLoading || !data) return <LoadingScreen></LoadingScreen>;

  return (
    <Tabs className="mt-[3rem]">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Options">
          <Tabs.Tab id="auto-fetch">
            {t("queries")}
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="manual-fetch">
            {t("actions")}
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="auto-fetch">
        <div className="flex flex-col gap-[1rem]">
          {data.queries.length ? (
            data.queries.map((query, index) => (
              <QueryComponent
                key={`${query.name}-${index}`}
                query={query}
                delay={index * 300}
              ></QueryComponent>
            ))
          ) : (
            <EmptyList></EmptyList>
          )}
        </div>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="manual-fetch">
        <div className="flex flex-col gap-[1rem]">
          {data.actions.length ? (
            data.actions.map((action, index) => (
              <ActionComponent
                key={`${action.name}-${index}`}
                action={action}
              ></ActionComponent>
            ))
          ) : (
            <EmptyList></EmptyList>
          )}
        </div>
      </Tabs.Panel>
    </Tabs>
  );
}

function RouteComponent() {
  const { connectionData } = useContext(MqttContext);
  const { device } = Route.useRouteContext();

  if (!connectionData || !device) return <Navigate to="/"></Navigate>;

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="flex flex-1 flex-col max-w-screen-md w-full px-[1rem] pb-[5rem]">
        <div className="flex flex-col pt-[5rem] pb-[2rem] gap-[2rem]">
          <div className="flex relative justify-center items-center">
            <ChipSVG className="h-[7rem] z-10" />
            <div className="flex absolute h-[10rem] w-[15rem] rounded-full bg-accent blur-2xl opacity-20"></div>
          </div>

          <div className="flex justify-center font-bold text-[20pt] z-10">
            {device.name}
          </div>
        </div>

        <Card>
          <Card.Content>
            <DataRow name="ID" value={device.id}></DataRow>
            <DataRow name="Request topic" value={device.requestTopic}></DataRow>
            <DataRow
              name="Response topic"
              value={device.responseTopic}
            ></DataRow>
          </Card.Content>
        </Card>

        <DeviceSchema></DeviceSchema>
      </div>
    </div>
  );
}
