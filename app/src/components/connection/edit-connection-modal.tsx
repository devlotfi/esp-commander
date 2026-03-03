import {
  Button,
  Form,
  Label,
  Modal,
  Switch,
  type UseOverlayStateReturn,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Pen } from "lucide-react";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { RxDBContext } from "../../context/rxdb-context";
import { useFormik } from "formik";
import ValidatedTextField from "../validated-text-field";
import type { ConnectionDocType } from "../../rxdb/connection";

interface EditConnectionModalProps {
  state: UseOverlayStateReturn;
  connection: ConnectionDocType;
}

export default function EditConnectionModal({
  state,
  connection,
}: EditConnectionModalProps) {
  const { t } = useTranslation();
  const { rxdb } = useContext(RxDBContext);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: Omit<ConnectionDocType, "id">) => {
      console.log(values);
      const doc = await rxdb.connections.findOne(connection.id).exec();
      if (!doc) return;
      await doc.incrementalModify((data) => {
        data.name = values.name;
        data.name = values.name;
        data.url = values.url;
        data.discoveryTopic = values.discoveryTopic;
        data.responseDiscoveryTopic = values.responseDiscoveryTopic;
        data.username = values.username || null;
        data.password = values.password || null;
        return data;
      });
      queryClient.resetQueries({
        queryKey: ["CONNECTIONS"],
      });
      state.close();
    },
  });

  const formik = useFormik({
    initialValues: {
      name: connection.name,
      url: connection.url,
      username: connection.username || "",
      password: connection.password || "",
      discoveryTopic: connection.discoveryTopic,
      responseDiscoveryTopic: connection.responseDiscoveryTopic,
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

  const [useAuth, setUseAuth] = useState<boolean>(
    connection.username ? true : false,
  );
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
              <Pen className="size-5" />
            </Modal.Icon>
            <Modal.Heading>{t("editConnection")}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="p-[0.1rem]">
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
                {t("edit")}
              </Button>
            </Form>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
