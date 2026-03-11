import { apiKeyMiddleware } from "./middlewares/api-key-middleware";
import { subscriptions } from "./routes/subscriptions";
import { HonoBindings } from "./types/hono-bindings";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";

const api = new OpenAPIHono<HonoBindings>();

api.use("*", cors());
api.use("*", apiKeyMiddleware);

api.openAPIRegistry.registerComponent("securitySchemes", "ApiKeyAuth", {
  type: "apiKey",
  in: "header",
  name: "x-api-key",
});

api.route("/subscriptions", subscriptions);

export { api };
