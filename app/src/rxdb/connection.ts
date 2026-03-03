import type { RxCollection, RxJsonSchema } from "rxdb";

export interface ConnectionDocType {
  id: string;
  name: string;
  url: string;
  username: string | null;
  password: string | null;
  discoveryTopic: string;
  responseDiscoveryTopic: string;
}

export type ConnectionCollection = RxCollection<ConnectionDocType>;

export const connectionSchemaLiteral: RxJsonSchema<ConnectionDocType> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 255,
    },
    name: {
      type: "string",
      maxLength: 255,
    },
    url: {
      type: "string",
      maxLength: 255,
    },
    username: {
      type: ["string", "null"],
      maxLength: 255,
    },
    password: {
      type: ["string", "null"],
      maxLength: 255,
    },
    discoveryTopic: {
      type: "string",
      maxLength: 255,
    },
    responseDiscoveryTopic: {
      type: "string",
      maxLength: 255,
    },
  },
  required: ["id", "url", "discoveryTopic", "responseDiscoveryTopic"],
};
