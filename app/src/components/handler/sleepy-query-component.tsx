import { Button, Card, Skeleton, Surface } from "@heroui/react";
import { useContext } from "react";
import { MqttContext } from "../../context/mqtt-context";
import ValueRow from "./value-row";
import EmptyHandlerRow from "./empty-handler-row";
import { Braces, RefreshCw, SquareFunction } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SleepyDeviceSchema } from "../../types/sleepy-device";

interface SleepyQueryComponentProps {
  data: SleepyDeviceSchema | null;
  refetch: () => void;
}

export default function SleepyQueryComponent({
  data,
  refetch,
}: SleepyQueryComponentProps) {
  const { t } = useTranslation();
  const { connectionData } = useContext(MqttContext);
  if (!connectionData) throw new Error("Missing data");

  if (!data)
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
            <div className="flex">{t("data")}</div>
          </div>

          <Button
            isIconOnly
            variant="outline"
            className="bg-[color-mix(in_srgb,var(--surface),transparent_80%)]"
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
          {data.query.results.length ? (
            data.query.results.map((result, index) => (
              <ValueRow
                key={`${result.name}-${index}`}
                value={result}
                valueData={data.results[result.name]}
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
