import { Button, Modal, type UseOverlayStateReturn } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { RxDBContext } from "../../context/rxdb-context";
import type { ConnectionDocType } from "../../rxdb/connection";
import { useTranslation } from "react-i18next";
import { Trash } from "lucide-react";

interface DeleteConnectionModalProps {
  state: UseOverlayStateReturn;
  connection: ConnectionDocType;
}

export default function DeleteConnectionModal({
  state,
  connection,
}: DeleteConnectionModalProps) {
  const { t } = useTranslation();
  const { rxdb } = useContext(RxDBContext);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const doc = await rxdb.connections.findOne(connection.id).exec();
      if (!doc) return;
      await doc.remove();
      queryClient.resetQueries({
        queryKey: ["CONNECTIONS"],
      });
      state.close();
    },
  });

  return (
    <Modal.Backdrop
      variant="blur"
      isOpen={state.isOpen}
      onOpenChange={state.setOpen}
    >
      <Modal.Container placement="center">
        <Modal.Dialog className="sm:max-w-[360px]">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-danger-soft text-danger-soft-foreground">
              <Trash className="size-5" />
            </Modal.Icon>
            <Modal.Heading>{t("deleteConnection")}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <div className="flex">{t("deleteConfirmation")}</div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline" onPress={() => state.close()}>
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              isPending={isPending}
              onPress={() => mutate()}
            >
              {t("delete")}
              <Trash></Trash>
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
