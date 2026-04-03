import { createFileRoute } from "@tanstack/react-router";
import { useContext, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Avatar,
  Button,
  Card,
  ScrollShadow,
  Spinner,
  toast,
} from "@heroui/react";
import { type Content, type Part } from "@google/genai";
import { GeminiContext } from "../../context/gemini-content";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import ValidatedTextField from "../../components/validated-text-field";
import { BrainCircuit, InfoIcon, Send, Trash } from "lucide-react";
import AISVG from "../../components/svg/AISVG";
import type { ModelResponseData } from "../../types/model-response-data";
import ModelMessage from "../../components/ai/model-message";
import UserMessage from "../../components/ai/user-message";
import { SchemaContext } from "../../context/schema-context";
import { Constants } from "../../constants";

export const Route = createFileRoute("/ai/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { devices, functions, lookup } = useContext(SchemaContext);
  const { ai } = useContext(GeminiContext);
  if (!ai) throw new Error("No ai client");

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentsRef = useRef<Content[]>([]);
  const [contents, setContents] = useState<Content[]>([]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [contents]);

  const promptMutation = useMutation({
    mutationFn: async ({ prompt }: { prompt: string }) => {
      const userContent: Content = {
        role: "user",
        parts: [{ text: prompt }] as Part[],
      };
      contentsRef.current = [...contentsRef.current, userContent];
      setContents((contents) => [...contents, userContent]);

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: contentsRef.current,
        config: {
          tools: [
            {
              functionDeclarations: functions,
            },
          ],
        },
      });
      if (response.candidates && response.candidates[0].content) {
        const content = response.candidates[0].content;
        console.log(JSON.stringify(response.candidates[0].content));
        contentsRef.current = [...contentsRef.current, content];
        setContents((contents) => [...contents, content]);
      } else {
        console.log("missing data");
      }

      console.log(JSON.stringify(contentsRef.current));
    },
    onError(error) {
      console.error(error);
      toast(`${t("error")}`, {
        indicator: <InfoIcon />,
        variant: "danger",
      });
    },
  });

  const respondToModelMutation = useMutation({
    mutationFn: async ({ data }: { data: ModelResponseData[] }) => {
      const userContent: Content = {
        role: "user",
        parts: data.map(
          (data) =>
            ({
              functionResponse: {
                name: data.functionCall.name,
                response: data.data,
              },
            }) as Part,
        ),
      };
      console.log("rsponding", userContent);

      contentsRef.current = [...contentsRef.current, userContent];
      setContents((contents) => [...contents, userContent]);
      console.log("responding");

      const response = await ai.models.generateContent({
        model: Constants.AI_CHAT_MODEL,
        contents: contentsRef.current,
        config: {
          tools: [
            {
              functionDeclarations: functions,
            },
          ],
        },
      });
      if (response.candidates && response.candidates[0].content) {
        const content = response.candidates[0].content;
        console.log(JSON.stringify(response.candidates[0].content));
        contentsRef.current = [...contentsRef.current, content];
        setContents((contents) => [...contents, content]);
      } else {
        console.log("missing data");
      }

      console.log(JSON.stringify(contentsRef.current));
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
    initialValues: {
      prompt: "",
    },
    async onSubmit(values, formikHelpers) {
      formikHelpers.resetForm();
      console.log(values);
      promptMutation.mutate(values);
    },
  });

  const renderChat = () => {
    return contents.map((content, index) => {
      if (content.role === "user") {
        return <UserMessage key={index} content={content}></UserMessage>;
      } else if (content.role === "model") {
        return (
          <ModelMessage
            key={index}
            content={content}
            lookup={lookup}
            devices={devices}
            respondToModel={(data) => respondToModelMutation.mutate({ data })}
          ></ModelMessage>
        );
      } else {
        console.error("Unknown role");
      }
    });
  };

  return (
    <div className="flex flex-col flex-1 items-center">
      <ScrollShadow
        ref={scrollRef}
        className="flex flex-col flex-1 w-full items-center px-[1rem]"
      >
        {contents.length ? (
          <div className="flex flex-col w-full gap-[1rem] max-w-screen-md">
            {renderChat()}

            {promptMutation.isPending ? (
              <div className="flex items-center justify-start gap-[0.5rem]">
                <Avatar color="accent">
                  <Avatar.Fallback>
                    <BrainCircuit></BrainCircuit>
                  </Avatar.Fallback>
                </Avatar>

                <Card>
                  <Card.Content>
                    <Spinner color="accent" size="md"></Spinner>
                  </Card.Content>
                </Card>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col flex-1 justify-center items-center w-full max-w-screen-md">
            <div className="flex flex-col items-center gap-[1rem] text-center">
              <AISVG className="h-[14rem]" />
              <div className="flex text-[18pt] font-bold uppercase">
                {t("welcome")}
              </div>
              <div className="flex text-[13pt] opacity-85">
                {t("useTheAIChat")}
              </div>
            </div>
          </div>
        )}
      </ScrollShadow>

      <form
        className="flex max-w-screen-md w-full p-[1rem]"
        onSubmit={formik.handleSubmit}
      >
        <ValidatedTextField
          formik={formik}
          name="prompt"
          inputGroupProps={{
            className: "rounded-3xl",
          }}
          inputProps={{
            className: "py-[1rem]",
            placeholder: t("typeSomething"),
          }}
          prefixProps={{
            className: "px-[0.5rem]",
          }}
          suffixProps={{
            className: "px-[0.5rem]",
          }}
          prefix={
            contents.length ? (
              <Button
                isIconOnly
                variant="outline"
                className="bg-[color-mix(in_srgb,var(--surface),transparent_70%)] rounded-2xl text-foreground"
                onPress={() => {
                  contentsRef.current = [];
                  setContents([]);
                }}
              >
                <Trash className="size-[1.3rem] text-danger"></Trash>
              </Button>
            ) : undefined
          }
          suffix={
            <Button
              isIconOnly
              isPending={promptMutation.isPending}
              type="submit"
              variant="primary"
              className="rounded-2xl"
            >
              <Send className="size-[1.3rem]"></Send>
            </Button>
          }
        ></ValidatedTextField>
      </form>
    </div>
  );
}
