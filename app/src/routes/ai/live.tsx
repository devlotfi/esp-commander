import {
  FunctionResponse,
  Modality,
  type FunctionCall,
  type GoogleGenAI,
} from "@google/genai";
import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { motion, useSpring, useTransform } from "motion/react";
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
import { Button, Spinner, toast } from "@heroui/react";
import { CircleOff, InfoIcon, Play } from "lucide-react";

export const Route = createFileRoute("/ai/live")({
  component: RouteComponent,
});

enum LiveChatStatus {
  IDLE = "IDLE",
  CONNECTING = "CONNECTING",
  LIVE = "LIVE",
  ERROR = "ERROR",
}

// ─── rms helper ───────────────────────────────────────────────────────────────

function rms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

// ─── audio-reactive orb ───────────────────────────────────────────────────────

/**
 * Shared mutable state written by audio callbacks, read by the rAF loop.
 * Using a plain object (not React state) so audio thread never triggers renders.
 */
interface OrbSignal {
  micLevel: number; // 0‥1, smoothed
  aiLevel: number; // 0‥1, smoothed
}

interface OrbProps {
  signal: RefObject<OrbSignal>;
  playerRef: RefObject<AudioPlayer | null>;
  status: LiveChatStatus;
}

function AudioOrb({ signal, playerRef, status }: OrbProps) {
  const rafRef = useRef<number>(0);
  const isIdle =
    status === LiveChatStatus.IDLE || status === LiveChatStatus.ERROR;
  const isConnecting = status === LiveChatStatus.CONNECTING;

  // ── spring motion values ───────────────────────────────────────────────────
  // The rAF loop writes raw 0‥1 levels into these; framer-motion physics do
  // all the interpolation — no manual decay math needed anymore.

  // Core orb: snappy attack, slow elastic release
  const springLevel = useSpring(0, { stiffness: 180, damping: 18, mass: 0.6 });

  // Rings lag behind the core for a ripple-out feel
  const ring1Level = useSpring(0, { stiffness: 80, damping: 14, mass: 1.0 });
  const ring2Level = useSpring(0, { stiffness: 45, damping: 12, mass: 1.4 });

  // Which speaker: 0 = mic/idle, 1 = AI — spring so hue crossfades smoothly
  const speakerSpring = useSpring(0, { stiffness: 60, damping: 20 });

  // ── derived motion values (no re-renders) ─────────────────────────────────
  const orbScale = useTransform(springLevel, [0, 1], [1, 1.28]);
  const orbOpacity = useTransform(
    springLevel,
    [0, 0.05, 1],
    [isIdle ? 0.6 : 0.7, 1, 1],
  );
  const glowSize = useTransform(springLevel, [0, 1], [0, 32]);

  // Blob shape: interpolate between circle and organic multi-radius shape
  const borderRadius = useTransform(springLevel, (l) => {
    if (l < 0.01) return "50%";
    return `${50 + l * 12}% ${50 - l * 8}% ${50 + l * 6}% ${50 - l * 10}% / ${50 - l * 10}% ${50 + l * 14}% ${50 - l * 6}% ${50 + l * 8}%`;
  });

  // Drop shadow that grows with level
  const filter = useTransform(glowSize, (g) =>
    g < 1
      ? "none"
      : `drop-shadow(0 0 ${g}px color-mix(in srgb, var(--accent), transparent 30%)) drop-shadow(0 0 ${g * 2}px color-mix(in srgb, var(--accent), transparent 60%))`,
  );

  // Ring 1: border ring that expands outward
  const ring1Scale = useTransform(ring1Level, [0, 1], [1, 1.55]);
  const ring1Opacity = useTransform(ring1Level, [0, 0.1, 1], [0, 0.8, 0.0]);

  // Ring 2: soft diffuse glow ring, lags even more
  const ring2Scale = useTransform(ring2Level, [0, 1], [1, 1.9]);
  const ring2Opacity = useTransform(ring2Level, [0, 0.1, 1], [0, 0.5, 0.0]);

  // ── rAF loop: measure audio, feed springs ────────────────────────────────
  useEffect(() => {
    function frame() {
      rafRef.current = requestAnimationFrame(frame);

      const liveAiLevel = playerRef.current?.getPlaybackLevel() ?? 0;
      signal.current.aiLevel = Math.max(
        liveAiLevel,
        signal.current.aiLevel * 0.97,
      );

      const { micLevel, aiLevel } = signal.current;
      const dominant = isIdle ? 0 : Math.max(micLevel, aiLevel);
      const isAi = aiLevel > micLevel;

      // Feed the raw level into the springs — framer handles all smoothing
      springLevel.set(dominant);
      ring1Level.set(dominant);
      ring2Level.set(dominant);
      speakerSpring.set(isAi ? 1 : 0);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [
    signal,
    playerRef,
    isIdle,
    springLevel,
    ring1Level,
    ring2Level,
    speakerSpring,
  ]);

  return (
    <div
      style={{
        position: "relative",
        width: 220,
        height: 220,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Ring 2 — outermost diffuse glow */}
      <motion.div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--accent), transparent 55%) 0%, transparent 70%)",
          translateX: "-50%",
          translateY: "-50%",
          scale: ring2Scale,
          opacity: ring2Opacity,
          pointerEvents: "none",
        }}
      />

      {/* Ring 1 — crisp border ring */}
      <motion.div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 140,
          height: 140,
          borderRadius: "50%",
          border:
            "1px solid color-mix(in srgb, var(--accent), transparent 35%)",
          translateX: "-50%",
          translateY: "-50%",
          scale: ring1Scale,
          opacity: ring1Opacity,
          pointerEvents: "none",
        }}
      />

      {/* Core orb */}
      <motion.div
        style={{
          width: 120,
          height: 120,
          background: isIdle
            ? "color-mix(in srgb, var(--surface), transparent 10%)"
            : `radial-gradient(
                ellipse at 38% 32%,
                color-mix(in srgb, white, transparent 40%) 0%,
                var(--accent) 50%,
                color-mix(in srgb, var(--accent), black 35%) 100%
              )`,
          boxShadow: isIdle
            ? "inset 0 -4px 12px color-mix(in srgb, var(--accent), transparent 60%)"
            : `inset 0 -6px 24px color-mix(in srgb, var(--accent), black 25%),
               inset 0 6px 16px color-mix(in srgb, white, transparent 65%)`,
          scale: orbScale,
          borderRadius,
          filter: isIdle ? "none" : filter,
          opacity: orbOpacity,
          willChange: "transform, border-radius, filter, opacity",
          // connecting: gentle CSS pulse, live: framer takes over
          animation: isConnecting
            ? "orbPulse 1.6s ease-in-out infinite"
            : "none",
        }}
      />

      <style>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1);    opacity: 0.55; }
          50%       { transform: scale(1.07); opacity: 0.9;  }
        }
      `}</style>
    </div>
  );
}

// ─── route component ──────────────────────────────────────────────────────────

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

  // Shared audio signal — written by audio callbacks, read by orb rAF
  const orbSignal = useRef<OrbSignal>({ micLevel: 0, aiLevel: 0 });

  // Smoothing: exponential moving average toward new value
  const { mutateAsync } = useMutation({
    retry: 5,
    mutationFn: async (
      functionCall: FunctionCall,
    ): Promise<ModelResponseData | null> => {
      if (!functionCall.name) return null;
      const originalFunction = lookup.get(functionCall.name);
      if (!originalFunction) return null;
      const device = devices.find((d) => d.id === originalFunction.deviceId);
      if (!device) return null;

      if (originalFunction.type === "query") {
        const res = await mqttQuery({
          client: connectionData.client,
          requestTopic: device.requestTopic,
          responseTopic: device.responseTopic,
          query: originalFunction.originalName,
        });
        if (res.status === ResponseStatus.ERROR) throw new Error(res.code);
        return {
          functionCall,
          originalFunction,
          data:
            Object.keys(res.results).length > 0
              ? res.results
              : { status: "success" },
        };
      } else if (originalFunction.type === "action") {
        const res = await mqttAction({
          client: connectionData.client,
          requestTopic: device.requestTopic,
          responseTopic: device.responseTopic,
          action: originalFunction.originalName,
          parameters: functionCall.args as HandlerData,
        });
        if (res.status === ResponseStatus.ERROR) throw new Error(res.code);
        return {
          functionCall,
          originalFunction,
          data:
            Object.keys(res.results).length > 0
              ? res.results
              : { status: "success" },
        };
      }
      return null;
    },
  });

  // Decay orb levels — multiplicative per-frame so the orb stays alive
  // between Gemini audio bursts (~0.97^60 ≈ halves every ~1.1 s)
  useEffect(() => {
    let raf: number;
    function decay() {
      raf = requestAnimationFrame(decay);
      const s = orbSignal.current;
      s.micLevel *= 0.97;
      s.aiLevel *= 0.97;
    }
    raf = requestAnimationFrame(decay);
    return () => cancelAnimationFrame(raf);
  }, []);

  const start = useCallback(async () => {
    setStatus(LiveChatStatus.CONNECTING);

    try {
      const player = new AudioPlayer();
      playerRef.current = player;

      const session = await ai.live.connect({
        model: Constants.LIVE_CHAT_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          tools: [{ functionDeclarations: functions }],
        },
        callbacks: {
          onopen: () => setStatus(LiveChatStatus.LIVE),

          onmessage: async (msg) => {
            for (const part of msg.serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                const samples = base64PcmToFloat32(part.inlineData.data);
                player.enqueue(samples);
                // Measure AI level from the decoded PCM directly
                // AI level is now driven by the AudioPlayer's AnalyserNode
                // (polled in the orb's rAF loop), so no arrival-side measurement needed.
              }
            }

            if (msg.toolCall?.functionCalls) {
              const responseList: ModelResponseData[] = [];
              for (const functionCall of msg.toolCall.functionCalls) {
                const res = await mutateAsync(functionCall);
                if (res !== null) responseList.push(res);
              }
              const functionResponses: FunctionResponse[] = responseList.map(
                (r) => ({
                  id: r.functionCall.id,
                  name: r.functionCall.name,
                  response: r.data,
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
          onclose: () => setStatus(LiveChatStatus.IDLE),
        },
      });

      sessionRef.current = session;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      streamRef.current = stream;

      const micCtx = new AudioContext({
        sampleRate: Constants.LIVE_CHAT_MIC_SAMPLE_RATE,
      });
      micCtxRef.current = micCtx;

      await micCtx.audioWorklet.addModule("/mic-processor.js");

      const source = micCtx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(micCtx, "mic-processor");
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
        if (!sessionRef.current) return;

        // Measure mic level from the raw PCM chunk
        // Instant attack: take the max so the orb jumps immediately when speaking.
        // * 18 maps typical mic RMS (~0.03–0.08) to a visible 0.5–1.0 range.
        const level = Math.min(1, rms(e.data) * 18);
        orbSignal.current.micLevel = Math.max(
          orbSignal.current.micLevel,
          level,
        );

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
      toast(`${t("error")}`, { indicator: <InfoIcon />, variant: "danger" });
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
    orbSignal.current = { micLevel: 0, aiLevel: 0 };
    setStatus(LiveChatStatus.IDLE);
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const isLive = status === LiveChatStatus.LIVE;
  const busy = status === LiveChatStatus.CONNECTING;

  return (
    <div className="flex flex-1 flex-col justify-center items-center gap-8">
      <AudioOrb signal={orbSignal} playerRef={playerRef} status={status} />

      {busy ? (
        <Spinner color="accent" size="lg"></Spinner>
      ) : isLive ? (
        <Button
          variant="outline"
          size="lg"
          className="bg-[color-mix(in_srgb,var(--surface),transparent_80%)]"
          onPress={stop}
        >
          {t("stop")}
          <CircleOff></CircleOff>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="lg"
          className="bg-[color-mix(in_srgb,var(--surface),transparent_80%)]"
          onPress={start}
        >
          {t("start")}
          <Play></Play>
        </Button>
      )}
    </div>
  );
}
