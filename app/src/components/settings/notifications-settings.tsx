import { Alert, Button, Card, Separator, Skeleton, toast } from "@heroui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  Eye,
  EyeOff,
  InfoIcon,
} from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import ValidatedTextField from "../../components/validated-text-field";
import { useFormik } from "formik";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Constants } from "../../constants";
import * as yup from "yup";
import { urlBase64ToUint8Array } from "../../utils/urlbase64-to-uint8array";
import { $api, fetchClient } from "../../api/openapi-client";
import { z } from "zod";
import { arrayBufferToBase64 } from "../../utils/arraybuffer-to-base64";
import SectionTitle from "../section-title";

export default function NotificationsSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["NOTIFICATIONS"],
    queryFn: async () => {
      const permission = Notification.permission;
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      const apiSecret = localStorage.getItem(Constants.API_SECRET_STORAGE_KEY);
      const apiUrl = localStorage.getItem(Constants.API_URL_STORAGE_KEY);
      const vapidPublicKeyBuffer = subscription
        ? subscription.getKey("p256dh")
        : null;

      return {
        permission,
        subscription,
        apiSecret,
        apiUrl,
        vapidPublicKeyBuffer,
      };
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({
      apiUrl,
      apiSecret,
      vapidPublicKey,
    }: {
      apiUrl: string;
      apiSecret: string;
      vapidPublicKey: string;
    }) => {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error();

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const subscriptionJson = sub.toJSON();

      try {
        const requestData = await z
          .object({
            endpoint: z.url(),
            expirationTime: z.number().nullable(),
            keys: z.object({
              p256dh: z.string(),
              auth: z.string(),
            }),
          })
          .safeParseAsync(subscriptionJson);
        if (!requestData.data) throw new Error();

        const { error } = await fetchClient.POST("/api/subscriptions/add", {
          baseUrl: apiUrl,
          headers: {
            "x-api-key": apiSecret,
          },
          body: requestData.data,
        });
        if (error) throw new Error();
      } catch {
        if (!sub) return;
        await sub.unsubscribe();
        throw new Error();
      }

      queryClient.resetQueries({
        queryKey: ["NOTIFICATIONS"],
      });
    },
    onSuccess() {
      toast(t("actionSuccess"), {
        indicator: <Check />,
        variant: "success",
      });
    },
    onError(error) {
      console.error(error);
      toast(`${t("error")}`, {
        indicator: <InfoIcon />,
        variant: "danger",
      });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!data?.subscription) return;
      await data.subscription.unsubscribe();
      queryClient.resetQueries({
        queryKey: ["NOTIFICATIONS"],
      });
    },
  });

  const testSubscribtionMutation = $api.useMutation(
    "post",
    "/api/subscriptions/test",
    {
      onError(error) {
        console.error(error);
        toast(`${t("error")}`, {
          indicator: <InfoIcon />,
          variant: "danger",
        });
      },
    },
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      apiUrl: data?.apiUrl || "",
      apiSecret: data?.apiSecret || "",
      vapidPublicKey:
        data?.subscription && data.vapidPublicKeyBuffer
          ? arrayBufferToBase64(data.vapidPublicKeyBuffer)
          : "",
    },
    validationSchema: yup.object({
      apiUrl: yup.string().url().required(),
      apiSecret: yup.string().required(),
      vapidPublicKey: yup.string().required(),
    }),
    onSubmit(values) {
      localStorage.setItem(Constants.API_URL_STORAGE_KEY, values.apiUrl);
      localStorage.setItem(Constants.API_SECRET_STORAGE_KEY, values.apiSecret);
      console.log(values);
      subscribeMutation.mutate(values);
    },
  });

  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  if (isLoading || !data)
    return (
      <Card className="mt-[2rem]">
        <Card.Content className="gap-[1rem]">
          <Skeleton className="h-3 w-1/2 rounded-lg" />
          <Skeleton className="h-3 rounded-lg" />
          <Skeleton className="h-3 rounded-lg" />
          <Skeleton className="h-3 rounded-lg" />
        </Card.Content>
      </Card>
    );

  return (
    <Card className="mt-[2rem]">
      <Card.Content className="flex flex-col gap-[0.7rem]">
        <SectionTitle icon="bell-ring">{t("notifications")}</SectionTitle>

        {data.subscription ? (
          <>
            <Alert status="success">
              <DynamicIcon
                name="bell-ring"
                className="text-success"
              ></DynamicIcon>
              <Alert.Content>
                <Alert.Title>{t("notificationsSubscribed")}</Alert.Title>
              </Alert.Content>
            </Alert>
            <Button
              fullWidth
              isPending={testSubscribtionMutation.isPending}
              onPress={() =>
                testSubscribtionMutation.mutate({
                  baseUrl: data.apiUrl!,
                  headers: {
                    "x-api-key": data.apiSecret,
                  },
                })
              }
            >
              {t("test")}
              <BellRing></BellRing>
            </Button>
          </>
        ) : (
          <Alert status="danger">
            <DynamicIcon name="bell-off" className="text-danger"></DynamicIcon>
            <Alert.Content>
              <Alert.Title>{t("notificationsNotSubscribed")}</Alert.Title>
            </Alert.Content>
          </Alert>
        )}

        <Separator className="bg-border my-[1rem]"></Separator>

        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col gap-[0.5rem]"
        >
          <ValidatedTextField
            formik={formik}
            name="apiUrl"
            textFieldProps={{
              isRequired: true,
              isDisabled: data.subscription ? true : false,
            }}
            labelProps={{ children: t("apiUrl") }}
          ></ValidatedTextField>
          <ValidatedTextField
            formik={formik}
            name="apiSecret"
            labelProps={{ children: t("apiSecret") }}
            inputProps={{
              type: isVisible ? "text" : "password",
            }}
            textFieldProps={{
              isRequired: true,
              isDisabled: data.subscription ? true : false,
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
          <ValidatedTextField
            formik={formik}
            name="vapidPublicKey"
            textFieldProps={{
              isRequired: true,
              isDisabled: data.subscription ? true : false,
            }}
            labelProps={{ children: t("vapidPublicKey") }}
          ></ValidatedTextField>

          {data.subscription ? (
            <Button
              fullWidth
              variant="outline"
              type="button"
              className="mt-[1rem] text-danger"
              isPending={unsubscribeMutation.isPending}
              onPress={() => unsubscribeMutation.mutate()}
            >
              {t("unsubscribe")}
              <BellOff></BellOff>
            </Button>
          ) : (
            <Button
              fullWidth
              type="submit"
              isPending={subscribeMutation.isPending}
              className="mt-[1rem]"
            >
              {t("subscribe")}
              <Bell></Bell>
            </Button>
          )}
        </form>
      </Card.Content>
    </Card>
  );
}
