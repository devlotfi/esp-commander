import {
  createFileRoute,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import SchemaProvider from "../../provider/schema-provider";
import SectionHeader from "../../components/section-header";
import { useTranslation } from "react-i18next";
import { Tabs } from "@heroui/react";
import { Bot, MessagesSquare } from "lucide-react";
import RequiredConnectionProvider from "../../provider/required-connection-provider";
import RequiredGeminiProvider from "../../provider/required-gemini-provider";

export const Route = createFileRoute("/ai")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <RequiredConnectionProvider>
      <RequiredGeminiProvider>
        <SchemaProvider>
          <div className="flex flex-col flex-1">
            <div className="flex self-center items-center justify-between p-[1rem] w-full max-w-screen-md">
              <SectionHeader
                icon="brain-circuit"
                className="hidden sm:flex py-0 gap-[0.8rem]"
                iconWrapperProps={{
                  className: "size-[2.5rem] md:size-[3rem]",
                  style: {
                    boxShadow: "",
                  },
                }}
                labelProps={{
                  className: "text-[16pt]",
                }}
              >
                {t("aiChat")}
              </SectionHeader>

              <Tabs
                className="w-full sm:w-auto"
                selectedKey={
                  pathname === "/ai"
                    ? "chat"
                    : pathname === "/ai/live"
                      ? "live"
                      : undefined
                }
                onSelectionChange={(key) => {
                  switch (key.toString()) {
                    case "chat":
                      navigate({
                        to: "/ai",
                      });
                      break;
                    case "live":
                      navigate({
                        to: "/ai/live",
                      });
                      break;
                    default:
                      break;
                  }
                }}
              >
                <Tabs.ListContainer>
                  <Tabs.List aria-label="Options">
                    <Tabs.Tab id="chat" className="gap-[0.5rem] pl-[0.5rem]">
                      <MessagesSquare></MessagesSquare>
                      {t("chat")}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="live" className="gap-[0.5rem] pl-[0.5rem]">
                      <Bot></Bot>
                      {t("live")}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
              </Tabs>
            </div>
            <Outlet></Outlet>
          </div>
        </SchemaProvider>
      </RequiredGeminiProvider>
    </RequiredConnectionProvider>
  );
}
