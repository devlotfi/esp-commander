import { Card, Chip } from "@heroui/react";
import type { Device } from "../../types/device";
import { Globe } from "lucide-react";
import DataRow from "../data-row";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

interface DeviceComponentProps {
  device: Device;
}

export default function DeviceComponent({ device }: DeviceComponentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const navigate = useNavigate();

  return (
    <Card
      className="hover:border-accent cursor-pointer duration-200 transition-colors"
      onClick={() => {
        router.update({
          context: {
            device,
          },
        });
        navigate({ to: "/device" });
      }}
    >
      <Card.Header className="flex-row justify-between items-center">
        <Chip className="text-[11pt]">
          <Chip.Label>{device.name}</Chip.Label>
        </Chip>

        <Chip color="success" variant="primary">
          <Chip.Label>{t("online")}</Chip.Label>
          <Globe className="size-[1rem]"></Globe>
        </Chip>
      </Card.Header>
      <Card.Content>
        <DataRow name="ID" value={device.id} fold></DataRow>
        <DataRow
          name={t("requestTopic")}
          value={device.requestTopic}
          fold
        ></DataRow>
        <DataRow
          name={t("responseTopic")}
          value={device.responseTopic}
          fold
        ></DataRow>
      </Card.Content>
    </Card>
  );
}
