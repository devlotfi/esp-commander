import {
  Button,
  Form,
  Label,
  Modal,
  Switch,
  type UseOverlayStateReturn,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Plus } from "lucide-react";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { RxDBContext } from "../../context/rxdb-context";
import { useFormik } from "formik";
import ValidatedTextField from "../validated-text-field";
import type { ConnectionDocType } from "../../rxdb/connection";
import { v4 as uuid } from "uuid";

interface AddConnectionModalProps {
  state: UseOverlayStateReturn;
}

export default function AddConnectionModal({ state }: AddConnectionModalProps) {
  const { t } = useTranslation();
  const { rxdb } = useContext(RxDBContext);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (connection: Omit<ConnectionDocType, "id">) => {
      await rxdb.connections.insert({
        id: uuid(),
        name: connection.name,
        url: connection.url,
        discoveryTopic: connection.discoveryTopic,
        responseDiscoveryTopic: connection.responseDiscoveryTopic,
        username: connection.username || null,
        password: connection.password || null,
      });
      queryClient.resetQueries({
        queryKey: ["CONNECTIONS"],
      });
      state.close();
    },
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      url: "",
      username: "",
      password: "",
      discoveryTopic: "iot-commander/discovery/request",
      responseDiscoveryTopic: "iot-commander/discovery/response",
    },
    validationSchema: yup.object({
      name: yup.string().required(),
      url: yup
        .string()
        .matches(
          /^(wss?|WSS?):\/\/([a-zA-Z0-9.-]+|\[[0-9a-fA-F:]+\])(:\d{1,5})?(\/[^\s]*)?$/,
          {
            message: "Invalid url",
          },
        )
        .required(),
      username: yup.string(),
      password: yup.string(),
      discoveryTopic: yup.string().required(),
      responseDiscoveryTopic: yup.string().required(),
    }),
    onSubmit(values) {
      mutate(values);
    },
  });

  const [useAuth, setUseAuth] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <Modal.Backdrop
      isOpen={state.isOpen}
      onOpenChange={state.setOpen}
      variant="blur"
    >
      <Modal.Container placement="center">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
              <Plus className="size-5" />
            </Modal.Icon>
            <Modal.Heading>{t("addConnection")}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="p-[0.3rem]">
            <Form
              onSubmit={formik.handleSubmit}
              className="flex flex-col gap-[0.5rem]"
            >
              <ValidatedTextField
                formik={formik}
                name="name"
                textFieldProps={{ isRequired: true }}
                labelProps={{ children: t("name") }}
              ></ValidatedTextField>
              <ValidatedTextField
                formik={formik}
                name="url"
                textFieldProps={{ isRequired: true }}
                labelProps={{ children: "URL" }}
              ></ValidatedTextField>
              <ValidatedTextField
                formik={formik}
                name="discoveryTopic"
                textFieldProps={{ isRequired: true }}
                labelProps={{ children: "Discovery topic" }}
              ></ValidatedTextField>
              <ValidatedTextField
                formik={formik}
                name="responseDiscoveryTopic"
                textFieldProps={{ isRequired: true }}
                labelProps={{ children: "Response discovery topic" }}
              ></ValidatedTextField>

              <Switch isSelected={useAuth} onChange={setUseAuth}>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Label className="text-sm">{t("useAuthenthication")}</Label>
              </Switch>
              {useAuth ? (
                <>
                  <ValidatedTextField
                    formik={formik}
                    name="username"
                    labelProps={{ children: t("username") }}
                  ></ValidatedTextField>
                  <ValidatedTextField
                    formik={formik}
                    name="password"
                    labelProps={{ children: t("password") }}
                    inputProps={{
                      type: isVisible ? "text" : "password",
                    }}
                    suffix={
                      <Button
                        isIconOnly
                        variant="ghost"
                        size="sm"
                        onPress={toggleVisibility}
                      >
                        {isVisible ? <EyeOff></EyeOff> : <Eye></Eye>}
                      </Button>
                    }
                  ></ValidatedTextField>
                </>
              ) : null}

              <Button
                fullWidth
                isPending={isPending}
                type="submit"
                className="mt-[1rem]"
              >
                {t("add")}
              </Button>
            </Form>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
