import { Button, Card } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useContext, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { Settings } from "lucide-react";
import { GeminiContext } from "../context/gemini-content";
import AISVG from "../components/svg/AISVG";

export default function RequiredGeminiProvider({
  children,
}: PropsWithChildren) {
  const { t } = useTranslation();
  const { ai, apiSecret } = useContext(GeminiContext);
  const navigate = useNavigate();

  if (!ai || !apiSecret)
    return (
      <div className="flex flex-1 text-center justify-center items-center flex-col gap-[1rem] px-[1rem]">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center items-center flex-col gap-[1rem] px-[0.5rem]">
            <AISVG className="h-[12rem]" />
            <div className="flex text-[18pt] font-bold uppercase">
              {t("missingApiSecret")}
            </div>
            <div className="flex text-[13pt] opacity-85">
              {t("providerGeminiApiSecret")}
            </div>
          </Card.Content>

          <Card.Footer className="justify-center py-[0.5rem]">
            <Button
              variant="primary"
              onPress={() => navigate({ to: "/settings" })}
            >
              <Settings></Settings>
              {t("settings")}
            </Button>
          </Card.Footer>
        </Card>
      </div>
    );

  return children;
}
