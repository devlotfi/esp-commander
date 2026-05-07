import type { FunctionDeclaration } from "@google/genai";
import type { Device } from "../types/device";
import type { FunctionMeta } from "../utils/gemini-schema";
import { createContext } from "react";
import type { SleepyDevice } from "../types/sleepy-device";

interface SchemaContext {
  devices: Device[];
  sleepyDevices: SleepyDevice[];
  functions: FunctionDeclaration[];
  lookup: Map<string, FunctionMeta>;
}

export const SchemaContextInitialValue: SchemaContext = {
  devices: [],
  sleepyDevices: [],
  functions: [],
  lookup: new Map<string, FunctionMeta>(),
};

export const SchemaContext = createContext(SchemaContextInitialValue);
