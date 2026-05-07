import { type Schema, Type, type FunctionDeclaration } from "@google/genai";

import type { Value } from "../types/handler-call";
import type { DeviceSchema } from "../types/device";

// ----------------------------
// Types
// ----------------------------

export type FunctionMeta = {
  deviceId: string;
  type: "query" | "action" | "sleepyQuery" | "sleepyAction";
  originalName: string;
};

export type GeminiFunctionResult = {
  functions: FunctionDeclaration[];
  lookup: Map<string, FunctionMeta>;
};

// ----------------------------
// Helpers
// ----------------------------

function normalizeName(name?: string): string {
  if (!name || typeof name !== "string") {
    return "unknown";
  }

  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeDevicePrefix(device: DeviceSchema): string {
  return normalizeName(device.name ?? device.id ?? "device");
}

function mapValueToSchema(value: Value): Schema {
  const schema: Schema = {};

  switch (value.type) {
    case "INT":
    case "RANGE":
      schema.type = Type.INTEGER;
      if (value.type === "RANGE") {
        if (value.min !== undefined) schema.minimum = value.min;
        if (value.max !== undefined) schema.maximum = value.max;
      }
      break;

    case "FLOAT":
    case "DOUBLE":
      schema.type = Type.NUMBER;
      break;

    case "BOOL":
      schema.type = Type.BOOLEAN;
      break;

    case "STRING":
      schema.type = Type.STRING;
      break;

    case "ENUM":
      schema.type = Type.STRING;
      if (value.enumDefinition) {
        schema.enum = value.enumDefinition;
      }
      break;

    case "COLOR":
      schema.type = Type.STRING;
      schema.pattern = "^#[0-9A-Fa-f]{6}$";
      schema.description = "Hex color like #RRGGBB";
      break;

    default:
      schema.type = Type.STRING;
  }

  return schema;
}

function buildObjectSchema(values?: Value[]): Schema | undefined {
  if (!values || values.length === 0) return undefined;

  const properties: Record<string, Schema> = {};
  const required: string[] = [];

  for (const v of values) {
    if (!v?.name) continue;

    const key = normalizeName(v.name);
    properties[key] = mapValueToSchema(v);

    if (v.required) {
      required.push(key);
    }
  }

  return {
    type: Type.OBJECT,
    properties,
    ...(required.length ? { required } : {}),
  };
}

// ----------------------------
// Main Transformer
// ----------------------------

export function deviceSchemasToGeminiFunctions(
  devices: DeviceSchema[],
): GeminiFunctionResult {
  const functions: FunctionDeclaration[] = [];
  const lookup = new Map<string, FunctionMeta>();

  for (const device of devices) {
    if (!device?.id) {
      console.warn("Skipping device with missing id", device);
      continue;
    }

    const devicePrefix = normalizeDevicePrefix(device);
    const deviceIdEnum = [device.id];

    // -------- Queries --------
    for (const query of device.queries || []) {
      if (!query?.name) {
        console.warn("Skipping query with missing name", query);
        continue;
      }

      const fnName = `${devicePrefix}_${normalizeName(`get_${query.name}`)}`;

      const parameters: Schema = {
        type: Type.OBJECT,
        properties: {
          deviceId: {
            type: Type.STRING,
            enum: deviceIdEnum,
          },
        },
        required: ["deviceId"],
      };

      const response = buildObjectSchema(query.results);

      functions.push({
        name: fnName,
        description: `Query "${query.name}" from device "${device.name ?? device.id}"`,
        parameters,
        ...(response ? { response } : {}),
      });

      lookup.set(fnName, {
        deviceId: device.id,
        type: "query",
        originalName: query.name,
      });
    }

    // -------- Actions --------
    for (const action of device.actions || []) {
      if (!action?.name) {
        console.warn("Skipping action with missing name", action);
        continue;
      }

      const fnName = `${devicePrefix}_${normalizeName(action.name)}`;

      const properties: Record<string, Schema> = {
        deviceId: {
          type: Type.STRING,
          enum: deviceIdEnum,
        },
      };

      const required: string[] = ["deviceId"];

      for (const param of action.parameters || []) {
        if (!param?.name) continue;

        const key = normalizeName(param.name);
        properties[key] = mapValueToSchema(param);

        if (param.required) {
          required.push(key);
        }
      }

      const parameters: Schema = {
        type: Type.OBJECT,
        properties,
        required,
      };

      const response = buildObjectSchema(action.results);

      functions.push({
        name: fnName,
        description: `Execute "${action.name}" on device "${device.name ?? device.id}"`,
        parameters,
        ...(response ? { response } : {}),
      });

      lookup.set(fnName, {
        deviceId: device.id,
        type: "action",
        originalName: action.name,
      });
    }
  }

  return {
    functions,
    lookup,
  };
}
