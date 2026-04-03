import {
  FunctionResponse,
  Modality,
  type FunctionCall,
  type GoogleGenAI,
} from "@google/genai";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AudioPlayer } from "../../utils/audio-player";
import { GeminiContext } from "../../context/gemini-content";
import { Constants } from "../../constants";
import { base64PcmToFloat32 } from "../../utils/base64pcm-to-float32";
import { float32ToBase64Pcm } from "../../utils/float32-to-base64pcm";
import { SchemaContext } from "../../context/schema-context";
import { useMutation } from "@tanstack/react-query";
import { MqttContext } from "../../context/mqtt-context";
import { ResponseStatus, type HandlerData } from "../../types/handler-call";
import { mqttQuery } from "../../utils/mqtt-query";
import { mqttAction } from "../../utils/mqtt-action";
import type { ModelResponseData } from "../../types/model-response-data";
import { useTranslation } from "react-i18next";
import { toast } from "@heroui/react";
import { InfoIcon } from "lucide-react";

export const Route = createFileRoute("/ai/live")({
  component: RouteComponent,
});

enum LiveChatStatus {
  IDLE = "IDLE",
  CONNECTING = "CONNECTING",
  LIVE = "LIVE",
  ERROR = "ERROR",
}

function RouteComponent() {
  const { t } = useTranslation();
  const { connectionData } = useContext(MqttContext);
  if (!connectionData) throw new Error("Missing data");
  const { ai } = useContext(GeminiContext);
  if (!ai) throw new Error("No ai client");
  const { devices, functions, lookup } = useContext(SchemaContext);
  const [status, setStatus] = useState<LiveChatStatus>(LiveChatStatus.IDLE);
  const sessionRef = useRef<Awaited<
    ReturnType<GoogleGenAI["live"]["connect"]>
  > | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const { mutateAsync, isPending } = useMutation({
    retry: 5,
    mutationFn: async (
      functionCall: FunctionCall,
    ): Promise<ModelResponseData | null> => {
      if (!functionCall.name) return null;
      const originalFunction = lookup.get(functionCall.name);
      if (!originalFunction) return null;
      const device = devices.find(
        (device) => device.id === originalFunction.deviceId,
      );
      if (!device) return null;
      console.log("function call", functionCall);
      console.log("function original", lookup.get(functionCall.name));

      if (originalFunction.type === "query") {
        console.log("query");
        const res = await mqttQuery({
          client: connectionData.client,
          requestTopic: device.requestTopic,
          responseTopic: device.responseTopic,
          query: originalFunction.originalName,
        });
        if (res.status === ResponseStatus.ERROR) throw new Error(res.code);
        if (Object.keys(res.results).length > 0) {
          return {
            functionCall,
            originalFunction,
            data: res.results,
          };
        } else {
          return {
            functionCall,
            originalFunction,
            data: { status: "success" },
          };
        }
      } else if (originalFunction.type === "action") {
        console.log("action");
        const res = await mqttAction({
          client: connectionData.client,
          requestTopic: device.requestTopic,
          responseTopic: device.responseTopic,
          action: originalFunction.originalName,
          parameters: functionCall.args as HandlerData,
        });
        if (res.status === ResponseStatus.ERROR) throw new Error(res.code);
        if (Object.keys(res.results).length > 0) {
          return {
            functionCall,
            originalFunction,
            data: res.results,
          };
        } else {
          return {
            functionCall,
            originalFunction,
            data: { status: "success" },
          };
        }
      }

      return null;
    },
  });

  const start = useCallback(async () => {
    setStatus(LiveChatStatus.CONNECTING);

    try {
      playerRef.current = new AudioPlayer();

      const session = await ai.live.connect({
        model: Constants.LIVE_CHAT_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Aoede" },
            },
          },
          tools: [{ functionDeclarations: functions }],
        },
        callbacks: {
          onopen: () => {
            setStatus(LiveChatStatus.LIVE);
          },

          onmessage: async (msg) => {
            for (const part of msg.serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data)
                playerRef.current?.enqueue(
                  base64PcmToFloat32(part.inlineData.data),
                );
            }

            if (msg.toolCall?.functionCalls) {
              const responseList: ModelResponseData[] = [];
              console.log(msg.toolCall);
              for (const functionCall of msg.toolCall.functionCalls) {
                const res = await mutateAsync(functionCall);
                if (res !== null) {
                  responseList.push(res);
                }
              }

              const functionResponses: FunctionResponse[] = responseList.map(
                (response) => ({
                  id: response.functionCall.id,
                  name: response.functionCall.name,
                  response: response.data,
                }),
              );

              sessionRef.current?.sendToolResponse({ functionResponses });
            }
          },

          onerror: (e) => {
            console.error(e);
            toast(`${t("error")}`, {
              indicator: <InfoIcon />,
              variant: "danger",
            });
            setStatus(LiveChatStatus.ERROR);
          },
          onclose: () => {
            setStatus(LiveChatStatus.IDLE);
          },
        },
      });

      sessionRef.current = session;

      // ── microphone via AudioWorklet (replaces deprecated ScriptProcessor) ──
      //
      // The worklet runs mic-processor.js on the audio thread. Each quantum
      // (~128 samples at 16 kHz ≈ 8 ms) is posted to the main thread via
      // port.onmessage, where we encode it and forward to Gemini.
      //
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      streamRef.current = stream;

      const micCtx = new AudioContext({
        sampleRate: Constants.LIVE_CHAT_MIC_SAMPLE_RATE,
      });
      micCtxRef.current = micCtx;

      // Load the processor script from /public (served as a static file by Vite)
      await micCtx.audioWorklet.addModule("/mic-processor.js");

      const source = micCtx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(micCtx, "mic-processor");
      workletNodeRef.current = workletNode;

      // Main-thread message handler — receives Float32Array chunks from the worklet
      workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
        if (!sessionRef.current) return;
        sessionRef.current.sendRealtimeInput({
          audio: {
            data: float32ToBase64Pcm(e.data),
            mimeType: `audio/pcm;rate=${Constants.LIVE_CHAT_MIC_SAMPLE_RATE}`,
          },
        });
      };
      source.connect(workletNode);
    } catch (e) {
      console.error(e);
      toast(`${t("error")}`, {
        indicator: <InfoIcon />,
        variant: "danger",
      });
      setStatus(LiveChatStatus.ERROR);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai.live, functions]);

  const stop = useCallback(() => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    micCtxRef.current?.close();
    micCtxRef.current = null;
    sessionRef.current?.close();
    sessionRef.current = null;
    playerRef.current?.close();
    playerRef.current = null;
    setStatus(LiveChatStatus.IDLE);
  }, []);

  const isLive = status === LiveChatStatus.LIVE;
  const busy =
    status === LiveChatStatus.CONNECTING || status === LiveChatStatus.LIVE;

  return (
    <div className="flex flex-1 flex-col justify-center items-center">
      <div
        className="flex justify-center items-center rounded-full size-[10rem]"
        style={{
          background: "color-mix(in srgb, var(--accent), transparent 80%)",
          boxShadow:
            "color-mix(in srgb, var(--accent), transparent 80%) 0px -3px 0px inset",
        }}
      >
        <h1>lol</h1>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "monospace", padding: 24, maxWidth: 640 }}>
      <h2>Gemini Live Audio — PoC</h2>

      <button onClick={start} disabled={busy} style={{ marginRight: 8 }}>
        ▶ Start
      </button>
      <button onClick={stop} disabled={!busy}>
        ■ Stop
      </button>

      <span
        style={{
          marginLeft: 16,
          padding: "2px 8px",
          borderRadius: 4,
          fontSize: 12,
          background: isLive
            ? "#22c55e"
            : status === LiveChatStatus.ERROR
              ? "#ef4444"
              : "#64748b",
          color: "#fff",
        }}
      >
        {status}
      </span>

      {isLive && (
        <span style={{ marginLeft: 12, color: "#22c55e", fontWeight: "bold" }}>
          ● LIVE
        </span>
      )}
    </div>
  );
}
