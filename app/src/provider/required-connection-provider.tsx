import { Button, Card } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useContext, type PropsWithChildren } from "react";
import { MqttContext } from "../context/mqtt-context";
import { useTranslation } from "react-i18next";
import { Plug } from "lucide-react";
import ServerSVG from "../components/svg/ServerSVG";

export default function RequiredConnectionProvider({
  children,
}: PropsWithChildren) {
  const { t } = useTranslation();
  const { connectionData } = useContext(MqttContext);
  const navigate = useNavigate();

  if (!connectionData)
    return (
      <div className="flex flex-1 text-center justify-center items-center flex-col gap-[1rem] px-[1rem]">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center items-center flex-col gap-[1rem] px-[0.5rem]">
            <ServerSVG className="h-[12rem]" />
            <div className="flex text-[18pt] font-bold uppercase">
              {t("disconnected")}
            </div>
            <div className="flex text-[13pt] opacity-85">
              {t("connectToMqtt")}
            </div>
          </Card.Content>

          <Card.Footer className="justify-center py-[0.5rem]">
            <Button
              variant="primary"
              onPress={() => navigate({ to: "/connections" })}
            >
              <Plug></Plug>
              {t("connect")}
            </Button>
          </Card.Footer>
        </Card>
      </div>
    );

  return children;
}
