import type { FunctionDeclaration } from "@google/genai";
import type { Device } from "../types/device";
import type { FunctionMeta } from "../utils/gemini-schema";
import { createContext } from "react";

interface SchemaContext {
  devices: Device[];
  functions: FunctionDeclaration[];
  lookup: Map<string, FunctionMeta>;
}

export const SchemaContextInitialValue: SchemaContext = {
  devices: [],
  functions: [],
  lookup: new Map<string, FunctionMeta>(),
};

export const SchemaContext = createContext(SchemaContextInitialValue);
