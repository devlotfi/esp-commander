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
        username: connection.username || null,
        password: connection.password || null,
        discoveryTopic: connection.discoveryTopic,
        responseDiscoveryTopic: connection.responseDiscoveryTopic,
        sleepyDeviceDiscoveryTopic: connection.sleepyDeviceDiscoveryTopic,
        sleepyDeviceResponseDiscoveryTopic:
          connection.sleepyDeviceResponseDiscoveryTopic,
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
      useAuth: true,
      username: "",
      password: "",
      discoveryTopic: "esp-commander/discovery/request",
      responseDiscoveryTopic: "esp-commander/discovery/response",
      usesleepyDeviceDiscovery: true,
      sleepyDeviceDiscoveryTopic:
        "esp-commander/discovery/request/sleepy-peers",
      sleepyDeviceResponseDiscoveryTopic:
        "esp-commander/discovery/response/sleepy-peers",
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
      usesleepyDeviceDiscovery: yup.bool(),
      sleepyDeviceDiscoveryTopic: yup
        .string()
        .when("usesleepyDeviceDiscovery", {
          is: true,
          then: (schema) => schema.required(),
          otherwise: (schema) => schema.notRequired(),
        }),
      sleepyDeviceResponseDiscoveryTopic: yup
        .string()
        .when("usesleepyDeviceDiscovery", {
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
              <Plus className="size-5" />
            </Modal.Icon>
            <Modal.Heading>{t("addConnection")}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="p-[0.3rem]">
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
                    isSelected={formik.values.usesleepyDeviceDiscovery}
                    onChange={(value) =>
                      formik.setFieldValue("usesleepyDeviceDiscovery", value)
                    }
                  >
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Label className="text-sm">
                      {t("usesleepyDeviceDiscovery")}
                    </Label>
                  </Switch>
                  {formik.values.usesleepyDeviceDiscovery ? (
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
                {t("add")}
                <Plus></Plus>
              </Button>
            </Form>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
