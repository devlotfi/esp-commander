import { MiddlewareHandler } from "hono";
import { HonoBindings } from "../types/hono-bindings";

export const apiKeyMiddleware: MiddlewareHandler<HonoBindings> = async (
  c,
  next,
) => {
  const key = c.req.header("x-api-key");

  if (!key || key !== c.env.API_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
};
