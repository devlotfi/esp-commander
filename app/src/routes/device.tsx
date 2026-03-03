import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useContext, useState } from "react";
import { MqttContext } from "../context/mqtt-context";
import ChipSVG from "../assets/chip.svg";
import EmptySVG from "../assets/empty.svg";
import { Card, cn, Tabs } from "@heroui/react";
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
import { useScroll, motion, useMotionValueEvent } from "motion/react";
import { AppContext } from "../context/app-context";

export const Route = createFileRoute("/device")({
  component: RouteComponent,
});

function EmptyList() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-[1rem] items-center py-[3rem]">
      <img src={EmptySVG} alt="empty" className="h-[10rem]" />
      <div className="flex uppercase font-bold text-[20pt]">{t("empty")}</div>
    </div>
  );
}

function DeviceSchema() {
  const { t } = useTranslation();
  const { scrollRef } = useContext(AppContext);
  const { connectionData } = useContext(MqttContext);
  const { device } = Route.useRouteContext();
  if (!connectionData || !device) throw new Error("Missing data");
  const { scrollY } = useScroll({
    container: scrollRef,
  });
  const [isCompact, setIsCompact] = useState(false);
  useMotionValueEvent(scrollY, "change", (current) => {
    setIsCompact(current > 0);
  });

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
      <Tabs.ListContainer className="sticky top-[5.5rem] z-20">
        <Tabs.List
          aria-label="Options"
          className={cn(isCompact && "sticky-overlay")}
        >
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
  const { scrollRef } = useContext(AppContext);
  const { connectionData } = useContext(MqttContext);
  const { device } = Route.useRouteContext();
  const { scrollY } = useScroll({
    container: scrollRef,
  });
  const [isCompact, setIsCompact] = useState(false);
  useMotionValueEvent(scrollY, "change", (current) => {
    setIsCompact(current > 10);
  });

  if (!connectionData || !device) return <Navigate to="/"></Navigate>;

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="flex flex-1 flex-col max-w-screen-md w-full px-[1rem] pb-[5rem]">
        <motion.div
          layout
          transition={{
            layout: { type: "spring", stiffness: 300, damping: 30 },
          }}
          className={cn(
            "flex flex-col sticky top-[1rem] z-20 items-center pt-[5rem] pb-[2rem] gap-[2rem]",
            isCompact &&
              "flex-row pt-0 pb-0 p-[0.5rem] rounded-3xl gap-[1rem] sticky-overlay shadow-2xl",
          )}
        >
          <motion.div
            layout
            className="flex relative justify-center items-center"
          >
            <motion.img
              layout
              src={ChipSVG}
              alt="chip"
              className={cn("w-[12rem] z-10", isCompact && "w-[5rem]")}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <motion.div
              className={cn(
                "absolute h-[10rem] w-[15rem] rounded-full bg-accent blur-2xl opacity-20",
                isCompact && "opacity-0",
              )}
            />
          </motion.div>

          <motion.div
            layout
            className={cn(
              "flex justify-center font-bold text-[20pt] z-10 truncate",
              isCompact && "text-[15pt]",
            )}
          >
            {device.name}
          </motion.div>
        </motion.div>

        <Card className={cn(isCompact && "mt-[10rem]")}>
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
