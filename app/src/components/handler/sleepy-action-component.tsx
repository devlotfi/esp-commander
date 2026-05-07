import { Button, Card, Surface, toast, useOverlayState } from "@heroui/react";
import {
  type ErrorResponse,
  type HandlerData,
  type ESPCommanderSleepyAction,
} from "../../types/handler-call";
import { useContext } from "react";
import { MqttContext } from "../../context/mqtt-context";
import { useRouteContext } from "@tanstack/react-router";
import ValueRow from "./value-row";
import { Check, InfoIcon, Play, SquareFunction, Variable } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import EmptyHandlerRow from "./empty-handler-row";
import ActionParamsModal from "./action-params-modal";
import { useTranslation } from "react-i18next";
import { mqttSleepyAction } from "../../utils/mqtt-sleepy-action";

interface SleepyActionComponentProps {
  action: ESPCommanderSleepyAction;
}

export default function SleepyActionComponent({
  action,
}: SleepyActionComponentProps) {
  const { t } = useTranslation();
  const { connectionData } = useContext(MqttContext);
  const { sleepyDevice } = useRouteContext({ from: "/sleepy-device" });
  const state = useOverlayState();
  if (!connectionData || !sleepyDevice) throw new Error("Missing data");

  const { mutate, isPending } = useMutation({
    mutationFn: async (parameters: HandlerData) => {
      await mqttSleepyAction({
        client: connectionData.client,
        commandTopic: sleepyDevice.commandTopic,
        action: action.name,
        parameters,
      });
    },
    onSuccess() {
      toast(t("actionSuccess"), {
        indicator: <Check />,
        variant: "success",
      });
    },
    onError(error: ErrorResponse) {
      toast(`${t("error")}: ${error.code}`, {
        indicator: <InfoIcon />,
        variant: "danger",
      });
    },
  });

  return (
    <>
      {action.parameters && action.parameters.length ? (
        <ActionParamsModal
          state={state}
          action={action}
          onSubmit={(actionData) => {
            mutate(actionData);
            state.close();
          }}
        ></ActionParamsModal>
      ) : null}

      <Card className="p-[0.5rem] md:p-[1rem]">
        <Card.Content>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[0.5rem] text-[13pt] font-bold pl-[0.5rem] pb-[0.5rem]">
              <SquareFunction className="size-[13pt]"></SquareFunction>
              <div className="flex">{action.name}</div>
            </div>

            <Button
              isIconOnly
              variant="primary"
              isPending={isPending}
              style={{
                boxShadow:
                  "color-mix(in srgb, var(--accent), transparent 30%) 0 0 3rem 0",
              }}
              onPress={() => {
                if (action.parameters && action.parameters.length) {
                  state.open();
                } else {
                  mutate({});
                }
              }}
            >
              <Play></Play>
            </Button>
          </div>

          <div className="flex items-center gap-[0.5rem] text-[11pt] pl-[0.5rem] opacity-70">
            <Variable className="size-[13pt]"></Variable>
            <div className="flex">{t("parameters")}</div>
          </div>
          <Surface className="flex flex-col gap-[0.5rem] p-[0.5rem]">
            {action.parameters && action.parameters.length ? (
              action.parameters.map((parameter, index) => (
                <ValueRow
                  key={`${parameter.name}-${index}`}
                  value={parameter}
                ></ValueRow>
              ))
            ) : (
              <EmptyHandlerRow></EmptyHandlerRow>
            )}
          </Surface>
        </Card.Content>
      </Card>
    </>
  );
}
