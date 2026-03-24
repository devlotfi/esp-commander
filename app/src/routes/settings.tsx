import {
  Alert,
  Button,
  Card,
  cn,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  Label,
  ListBox,
  Select,
  Separator,
  Skeleton,
  toast,
} from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useContext, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import ArSVG from "../assets/flags/ar.svg";
import FrSVG from "../assets/flags/fr.svg";
import EnSVG from "../assets/flags/en.svg";
import {
  ThemeContext,
  ThemeContextInitialValue,
} from "../context/theme-context";
import { ThemeOptions } from "../types/theme-options";
import {
  Check,
  Computer,
  Eye,
  EyeOff,
  InfoIcon,
  Moon,
  RotateCcw,
  Sun,
} from "lucide-react";
import SectionHeader from "../components/section-header";
import { type IconName, DynamicIcon } from "lucide-react/dynamic";
import ValidatedTextField from "../components/validated-text-field";
import { useFormik } from "formik";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Constants } from "../constants";
import * as yup from "yup";
import { urlBase64ToUint8Array } from "../utils/urlbase64-to-uint8array";
import { $api, fetchClient } from "../api/openapi-client";
import { z } from "zod";
import { arrayBufferToBase64 } from "../utils/arraybuffer-to-base64";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function SectionTitle({
  children,
  icon,
  className,
  iconWrapperProps: {
    className: classNameIconWrapper,
    ...iconWrapperProps
  } = {},
  labelProps: { className: classNameLabel, ...labelProps } = {},
  ...props
}: {
  icon: IconName;
  iconWrapperProps?: ComponentProps<"div">;
  labelProps?: ComponentProps<"div">;
} & ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center gap-[1rem] pb-[1rem]", className)}
      {...props}
    >
      <div
        className={cn(
          "flex justify-center items-center rounded-2xl size-[2.5rem] bg-[color-mix(in_srgb,var(--surface),transparent_85%)] border",
          classNameIconWrapper,
        )}
        style={{
          boxShadow:
            "color-mix(in srgb, var(--surface), transparent 80%) 0px -3px 0px inset",
        }}
        {...iconWrapperProps}
      >
        <DynamicIcon
          name={icon}
          className="text-accent size-[1.6rem]"
        ></DynamicIcon>
      </div>
      <div
        className={cn("flex font-bold text-[16pt] uppercase", classNameLabel)}
        {...labelProps}
      >
        {children}
      </div>
    </div>
  );
}

function DisplaySettings() {
  const { themeOption, setTheme, accentColor, applyAccentColor } =
    useContext(ThemeContext);
  const { t, i18n } = useTranslation();

  const renderFlag = (languageCode: string, className?: string) => {
    switch (languageCode) {
      case "ar":
        return (
          <img
            src={ArSVG}
            alt="ar"
            className={cn("h-[1.5rem]", className)}
          ></img>
        );
      case "fr":
        return (
          <img
            src={FrSVG}
            alt="fr"
            className={cn("h-[1.5rem]", className)}
          ></img>
        );
      case "en":
        return (
          <img
            src={EnSVG}
            alt="eb"
            className={cn("h-[1.5rem]", className)}
          ></img>
        );
    }
  };

  return (
    <Card>
      <Card.Content className="flex flex-col gap-[0.7rem]">
        <SectionTitle icon="monitor-cog">{t("display")}</SectionTitle>

        <Select
          value={themeOption}
          onChange={(value) => setTheme(value?.toString() as ThemeOptions)}
        >
          <Label>{t("theme")}</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item
                key={ThemeOptions.SYSTEM}
                id={ThemeOptions.SYSTEM}
                textValue={t("system")}
              >
                <div className="flex gap-[1rem] items-center">
                  <div className="flex justify-center items-center h-[2rem] w-[2rem] bg-accent rounded-2xl">
                    <Computer className="text-accent-foreground"></Computer>
                  </div>
                  <div className="flex">{t("system")}</div>
                </div>
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item
                key={ThemeOptions.LIGHT}
                id={ThemeOptions.LIGHT}
                textValue={t("light")}
              >
                <div className="flex gap-[1rem] items-center">
                  <div className="flex justify-center items-center h-[2rem] w-[2rem] bg-accent rounded-2xl">
                    <Sun className="text-accent-foreground"></Sun>
                  </div>
                  <div className="flex">{t("light")}</div>
                </div>
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item
                key={ThemeOptions.DARK}
                id={ThemeOptions.DARK}
                textValue={t("dark")}
              >
                <div className="flex gap-[1rem] items-center">
                  <div className="flex justify-center items-center h-[2rem] w-[2rem] bg-accent rounded-2xl">
                    <Moon className="text-accent-foreground"></Moon>
                  </div>
                  <div className="flex">{t("dark")}</div>
                </div>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>

        <ColorField
          aria-label="color"
          fullWidth
          value={accentColor}
          onChange={(value) => {
            if (value) {
              applyAccentColor(value.toString("hex"));
            }
          }}
        >
          <Label>{t("accentColor")}</Label>

          <ColorField.Group className="h-[3rem]">
            <ColorField.Prefix>
              <ColorPicker
                value={accentColor}
                onChange={(value) => {
                  if (value) {
                    applyAccentColor(value.toString("hex"));
                  }
                }}
              >
                <ColorPicker.Trigger>
                  <ColorSwatch size="sm" />
                </ColorPicker.Trigger>
                <ColorPicker.Popover className="gap-2">
                  <ColorArea
                    aria-label="Color area"
                    className="max-w-full"
                    colorSpace="hsb"
                    xChannel="saturation"
                    yChannel="brightness"
                  >
                    <ColorArea.Thumb />
                  </ColorArea>

                  <ColorSlider
                    aria-label="Hue slider"
                    channel="hue"
                    className="flex-1"
                    colorSpace="hsb"
                  >
                    <ColorSlider.Track>
                      <ColorSlider.Thumb />
                    </ColorSlider.Track>
                  </ColorSlider>
                </ColorPicker.Popover>
              </ColorPicker>
            </ColorField.Prefix>
            <ColorField.Input />
          </ColorField.Group>

          <Button
            fullWidth
            variant="outline"
            size="lg"
            onPress={() =>
              applyAccentColor(ThemeContextInitialValue.accentColor)
            }
          >
            <RotateCcw></RotateCcw>
            {t("reset")}
          </Button>
        </ColorField>

        <Select
          value={i18n.language}
          onChange={(value) => i18n.changeLanguage(value?.toString())}
        >
          <Label>{t("language")}</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item key={"ar"} id={"ar"} textValue={"العربية"}>
                <div className="flex gap-[1rem] items-center">
                  <div className="flex justify-center items-center h-[2rem] w-[2rem] rounded-lg">
                    {renderFlag("ar")}
                  </div>
                  <div className="flex">العربية</div>
                </div>
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item key={"fr"} id={"fr"} textValue={"Français"}>
                <div className="flex gap-[1rem] items-center">
                  <div className="flex justify-center items-center h-[2rem] w-[2rem] rounded-lg">
                    {renderFlag("fr")}
                  </div>
                  <div className="flex">Français</div>
                </div>
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item key={"en"} id={"en"} textValue={"English"}>
                <div className="flex gap-[1rem] items-center">
                  <div className="flex justify-center items-center h-[2rem] w-[2rem] rounded-lg">
                    {renderFlag("en")}
                  </div>
                  <div className="flex">English</div>
                </div>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </Card.Content>
    </Card>
  );
}

function NotificationsSettings() {
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
            </Button>
          ) : (
            <Button
              fullWidth
              type="submit"
              isPending={subscribeMutation.isPending}
              className="mt-[1rem]"
            >
              {t("subscribe")}
            </Button>
          )}
        </form>
      </Card.Content>
    </Card>
  );
}

function RouteComponent() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center p-[1rem]">
      <div className="flex flex-col w-full max-w-screen-sm pb-[5rem]">
        <SectionHeader icon="settings">{t("settings")}</SectionHeader>

        <DisplaySettings></DisplaySettings>
        <NotificationsSettings></NotificationsSettings>
      </div>
    </div>
  );
}
