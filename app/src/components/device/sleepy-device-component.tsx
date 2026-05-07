import { Card, Chip } from "@heroui/react";
import { Globe } from "lucide-react";
import DataRow from "../data-row";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { SleepyDevice } from "../../types/sleepy-device";

interface SleepyDeviceComponentProps {
  sleepyDevice: SleepyDevice;
}

export default function SleepyDeviceComponent({
  sleepyDevice,
}: SleepyDeviceComponentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const navigate = useNavigate();

  return (
    <Card
      className="hover:border-accent cursor-pointer duration-200 transition-colors"
      onClick={() => {
        router.update({
          context: {
            sleepyDevice,
          },
        });
        navigate({ to: "/sleepy-device" });
      }}
    >
      <Card.Header className="flex-row justify-between items-center">
        <Chip className="text-[11pt]">
          <Chip.Label>{sleepyDevice.name}</Chip.Label>
        </Chip>

        <Chip color="success" variant="primary">
          <Chip.Label>{t("online")}</Chip.Label>
          <Globe className="size-[1rem]"></Globe>
        </Chip>
      </Card.Header>
      <Card.Content>
        <DataRow name="ID" value={sleepyDevice.id} fold></DataRow>
        <DataRow
          name={t("commandTopic")}
          value={sleepyDevice.commandTopic}
          fold
        ></DataRow>
        <DataRow
          name={t("dataTopic")}
          value={sleepyDevice.dataTopic}
          fold
        ></DataRow>
      </Card.Content>
    </Card>
  );
}
