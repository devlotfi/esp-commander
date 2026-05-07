import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useContext } from "react";
import { MqttContext } from "../context/mqtt-context";
import { Card, Tabs } from "@heroui/react";
import DataRow from "../components/data-row";
import LoadingScreen from "../components/loading-screen";
import { useTranslation } from "react-i18next";
import EmptySVG from "../components/svg/EmptySVG";
import ChipSVG from "../components/svg/ChipSVG";
import { useSleepyDeviceQuery } from "../hooks/use-sleepy-device-query";
import SleepyQueryComponent from "../components/handler/sleepy-query-component";
import SleepyActionComponent from "../components/handler/sleepy-action-component";

export const Route = createFileRoute("/sleepy-device")({
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
  const { sleepyDevice } = Route.useRouteContext();
  if (!connectionData || !sleepyDevice) throw new Error("Missing data");
  const { sleepyDeviceData, refetch } = useSleepyDeviceQuery(sleepyDevice);

  if (!sleepyDeviceData) return <LoadingScreen></LoadingScreen>;

  return (
    <Tabs className="mt-[3rem]">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Options">
          <Tabs.Tab id="data">
            {t("data")}
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="actions">
            {t("actions")}
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="data">
        <div className="flex flex-col gap-[1rem]">
          <SleepyQueryComponent
            data={sleepyDeviceData}
            refetch={refetch}
          ></SleepyQueryComponent>
        </div>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="actions">
        <div className="flex flex-col gap-[1rem]">
          {sleepyDeviceData.actions.length ? (
            sleepyDeviceData.actions.map((action, index) => (
              <SleepyActionComponent
                key={`${action.name}-${index}`}
                action={action}
              ></SleepyActionComponent>
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
  const { t } = useTranslation();
  const { connectionData } = useContext(MqttContext);
  const { sleepyDevice } = Route.useRouteContext();

  if (!connectionData || !sleepyDevice) return <Navigate to="/"></Navigate>;

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="flex flex-1 flex-col max-w-screen-md w-full px-[1rem] pb-[5rem]">
        <div className="flex flex-col pt-[5rem] pb-[2rem] gap-[2rem]">
          <div className="flex relative justify-center items-center">
            <ChipSVG className="h-[7rem] z-10" />
            <div className="flex absolute h-[10rem] w-[15rem] rounded-full bg-accent blur-2xl opacity-20"></div>
          </div>

          <div className="flex justify-center font-bold text-[20pt] z-10">
            {sleepyDevice.name}
          </div>
        </div>

        <Card>
          <Card.Content>
            <DataRow name="ID" value={sleepyDevice.id}></DataRow>
            <DataRow
              name={t("commandTopic")}
              value={sleepyDevice.commandTopic}
            ></DataRow>
            <DataRow
              name={t("dataTopic")}
              value={sleepyDevice.dataTopic}
            ></DataRow>
          </Card.Content>
        </Card>

        <DeviceSchema></DeviceSchema>
      </div>
    </div>
  );
}
