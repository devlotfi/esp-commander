import { Button, Card, toast } from "@heroui/react";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Eye, EyeOff, InfoIcon, Save } from "lucide-react";
import ValidatedTextField from "../../components/validated-text-field";
import { useFormik } from "formik";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Constants } from "../../constants";
import * as yup from "yup";
import SectionTitle from "../section-title";
import { GeminiContext } from "../../context/gemini-content";
import { GoogleGenAI } from "@google/genai";

export default function GeminiSettings() {
  const { t } = useTranslation();
  const { apiSecret } = useContext(GeminiContext);
  const queryClient = useQueryClient();

  const setApiKeyMutation = useMutation({
    mutationFn: async ({ apiSecret }: { apiSecret: string }) => {
      if (!apiSecret) {
        localStorage.removeItem(Constants.GEMINI_SECRET_STORAGE_KEY);
        return;
      }
      const ai = new GoogleGenAI({ apiKey: apiSecret });
      await ai.models.list();
      localStorage.setItem(Constants.GEMINI_SECRET_STORAGE_KEY, apiSecret);
      queryClient.resetQueries({
        queryKey: ["GEMINI_SECRET"],
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

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      apiSecret: apiSecret || "",
    },
    validationSchema: yup.object({
      apiSecret: yup.string().required(),
    }),
    onSubmit(values) {
      setApiKeyMutation.mutate(values);
    },
  });

  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <Card className="mt-[2rem]">
      <Card.Content className="flex flex-col gap-[0.7rem]">
        <SectionTitle icon="brain-circuit">Gemini</SectionTitle>
        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col gap-[0.5rem]"
        >
          <ValidatedTextField
            formik={formik}
            name="apiSecret"
            labelProps={{ children: t("apiSecret") }}
            inputProps={{
              type: isVisible ? "text" : "password",
            }}
            textFieldProps={{
              isRequired: true,
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

          <Button
            fullWidth
            type="submit"
            isPending={setApiKeyMutation.isPending}
            className="mt-[1rem]"
          >
            {t("save")}
            <Save></Save>
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}
