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
        data.username = values.username || null;
        data.password = values.password || null;
        data.discoveryTopic = values.discoveryTopic;
        data.responseDiscoveryTopic = values.responseDiscoveryTopic;
        data.sleepyDeviceDiscoveryTopic =
          values.sleepyDeviceDiscoveryTopic || null;
        data.sleepyDeviceResponseDiscoveryTopic =
          values.sleepyDeviceResponseDiscoveryTopic || null;
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
      useAuth: connection.username !== null,
      username: connection.username || "",
      password: connection.password || "",
      discoveryTopic: connection.discoveryTopic,
      responseDiscoveryTopic: connection.responseDiscoveryTopic,
      useSleepyDeviceDiscovery: connection.sleepyDeviceDiscoveryTopic !== null,
      sleepyDeviceDiscoveryTopic: connection.sleepyDeviceDiscoveryTopic || "",
      sleepyDeviceResponseDiscoveryTopic:
        connection.sleepyDeviceResponseDiscoveryTopic || "",
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
      useAuth: yup.bool(),
      username: yup.string().when("useAuth", {
        is: true,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.notRequired(),
      }),
      password: yup.string().when("useAuth", {
        is: true,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.notRequired(),
      }),
      discoveryTopic: yup.string().required(),
      responseDiscoveryTopic: yup.string().required(),
      useSleepyDeviceDiscovery: yup.bool(),
      sleepyDeviceDiscoveryTopic: yup
        .string()
        .when("useSleepyDeviceDiscovery", {
          is: true,
          then: (schema) => schema.required(),
          otherwise: (schema) => schema.notRequired(),
        }),
      sleepyDeviceResponseDiscoveryTopic: yup
        .string()
        .when("useSleepyDeviceDiscovery", {
          is: true,
          then: (schema) => schema.required(),
          otherwise: (schema) => schema.notRequired(),
        }),
    }),
    onSubmit(values) {
      mutate(values);
    },
  });

  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <Modal.Backdrop
      isOpen={state.isOpen}
      onOpenChange={state.setOpen}
      variant="blur"
    >
      <Modal.Container placement="center">
        <Modal.Dialog className="w-full max-w-screen-lg">
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
              <div className="flex flex-col lg:flex-row flex-1 gap-[1rem]">
                <div className="flex flex-1 flex-col gap-[0.5rem]">
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

                  <Switch
                    isSelected={formik.values.useAuth}
                    onChange={(value) => formik.setFieldValue("useAuth", value)}
                  >
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Label className="text-sm">{t("useAuthenthication")}</Label>
                  </Switch>
                  {formik.values.useAuth ? (
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
                </div>

                <div className="flex flex-1 flex-col gap-[0.5rem]">
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

                  <Switch
                    isSelected={formik.values.useSleepyDeviceDiscovery}
                    onChange={(value) =>
                      formik.setFieldValue("useSleepyDeviceDiscovery", value)
                    }
                  >
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Label className="text-sm">
                      {t("useSleepyDeviceDiscovery")}
                    </Label>
                  </Switch>
                  {formik.values.useSleepyDeviceDiscovery ? (
                    <>
                      <ValidatedTextField
                        formik={formik}
                        name="sleepyDeviceDiscoveryTopic"
                        labelProps={{
                          children: t("sleepyDeviceDiscoveryTopic"),
                        }}
                      ></ValidatedTextField>
                      <ValidatedTextField
                        formik={formik}
                        name="sleepyDeviceResponseDiscoveryTopic"
                        labelProps={{
                          children: t("sleepyDeviceResponseDiscoveryTopic"),
                        }}
                      ></ValidatedTextField>
                    </>
                  ) : null}
                </div>
              </div>

              <Button
                fullWidth
                isPending={isPending}
                type="submit"
                className="mt-[1rem]"
              >
                {t("edit")}
                <Pen></Pen>
              </Button>
            </Form>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
