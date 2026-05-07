export enum KnownErrors {
  INVALID_JSON = "INVALID_JSON",
  INVALID_FORMAT = "INVALID_FORMAT",
  ACTION_NOT_FOUND = "ACTION_NOT_FOUND",
  QUERY_NOT_FOUND = "QUERY_NOT_FOUND",
  INVALID_PARAMETERS = "INVALID_PARAMETERS",
  INVALID_RESULTS = "INVALID_RESULTS",
}

export enum ValueType {
  INT = "INT",
  RANGE = "RANGE",
  FLOAT = "FLOAT",
  DOUBLE = "DOUBLE",
  BOOL = "BOOL",
  STRING = "STRING",
  ENUM = "ENUM",
  COLOR = "COLOR",
}

export enum ResponseStatus {
  OK = "OK",
  ERROR = "ERROR",
}

export interface Value {
  name: string;
  type: ValueType;
  required: boolean;
  enumDefinition?: string[];
  min?: number;
  max?: number;
}

export interface ESPCommanderAction {
  name: string;
  parameters?: Value[];
  results?: Value[];
}

export interface ESPCommanderSleepyAction {
  name: string;
  parameters?: Value[];
}

export interface ESPCommanderQuery {
  name: string;
  results: Value[];
}

export interface ESPCommanderSleepyQuery {
  results: Value[];
}

export type AllowedTypes = number | boolean | string;

export interface HandlerData {
  [key: string]: AllowedTypes;
}

export interface QueryRequest {
  requestId: string;
  query: string;
}

export interface ActionRequest<T = HandlerData> {
  requestId: string;
  action: string;
  parameters: T;
}

export interface OkResponse<T = HandlerData> {
  requestId: string;
  status: ResponseStatus.OK;
  results: T;
}

export interface ErrorResponse {
  requestId: string;
  status: ResponseStatus.ERROR;
  code: KnownErrors | string;
}

export type HandlerResponse<T = HandlerData> = OkResponse<T> | ErrorResponse;
