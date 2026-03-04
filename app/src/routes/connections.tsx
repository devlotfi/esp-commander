import { Button, Card, useOverlayState } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useContext } from "react";
import { RxDBContext } from "../context/rxdb-context";
import LoadingScreen from "../components/loading-screen";
import ErrorScreen from "../components/error-screen";
import { useTranslation } from "react-i18next";
import SectionHeader from "../components/section-header";
import { Plus } from "lucide-react";
import AddConnectionModal from "../components/connection/add-connection-modal";
import ConnectionComponent from "../components/connection/connection-component";
import EmptySVG from "../components/svg/EmptySVG";

export const Route = createFileRoute("/connections")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { rxdb } = useContext(RxDBContext);

  const addConnectionModalState = useOverlayState();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["CONNECTIONS"],
    queryFn: async () => {
      const data = await rxdb.connections.find().exec();
      return data;
    },
  });

  return (
    <>
      <AddConnectionModal state={addConnectionModalState}></AddConnectionModal>

      <div className="flex flex-1 flex-col items-center">
        <div className="flex flex-1 flex-col max-w-screen-md w-full">
          <div className="flex justify-between items-center z-10 py-[1rem] px-[1rem]">
            <SectionHeader icon="satellite-dish">
              {t("connections")}
            </SectionHeader>

            <Button
              isIconOnly
              variant="outline"
              className="size-[3rem] text-foreground bg-[color-mix(in_srgb,var(--surface),transparent_85%)]"
              onPress={() => addConnectionModalState.open()}
            >
              <Plus className="size-[2rem]"></Plus>
            </Button>
          </div>

          {isLoading ? (
            <LoadingScreen></LoadingScreen>
          ) : isError ? (
            <ErrorScreen></ErrorScreen>
          ) : data && data.length ? (
            <div className="flex flex-col flex-1 mt-[0.5rem] gap-[1rem] pl-[1rem] pr-[2.5rem] pb-[5rem]">
              {data.map((connection) => (
                <ConnectionComponent
                  key={connection.id}
                  connection={connection}
                ></ConnectionComponent>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 justify-center items-center px-[1rem]">
              <Card className="max-w-md w-full">
                <Card.Content className="text-center items-center flex-col gap-[1rem] px-[0.5rem]">
                  <EmptySVG className="h-[10rem]" />
                  <div className="flex text-[18pt] font-bold uppercase">
                    {t("noConnections.title")}
                  </div>
                  <div className="flex text-[13pt] opacity-85">
                    {t("noConnections.subTitle")}
                  </div>
                </Card.Content>

                <Card.Footer className="justify-center py-[0.5rem]">
                  <Button
                    variant="primary"
                    style={{
                      boxShadow:
                        "color-mix(in srgb, var(--accent), transparent 50%) 0 0 2rem 0",
                    }}
                    onPress={() => addConnectionModalState.open()}
                  >
                    <Plus></Plus>
                    {t("addConnection")}
                  </Button>
                </Card.Footer>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
