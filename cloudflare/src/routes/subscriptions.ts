import { HonoBindings } from "../types/hono-bindings";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { env } from "cloudflare:workers";
import webpush, { type PushSubscription } from "web-push";
import { SubscriptionRow } from "../models/subscription";

webpush.setVapidDetails(
  "mailto:test@test.com",
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY,
);

const subscriptions = new OpenAPIHono<HonoBindings>();

subscriptions.openapi(
  createRoute({
    method: "post",
    path: "/add",
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              endpoint: z.url(),
              expirationTime: z.number().nullable(),
              keys: z.object({
                p256dh: z.string(),
                auth: z.string(),
              }),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
            }),
          },
        },
        description: "Add subscription",
      },
    },
  }),
  async (c) => {
    const sub = await c.req.valid("json");
    await c.env.D1_DB.prepare(
      "INSERT INTO Subscriptions (endpoint, expiration_time, p256dh, auth) VALUES (?, ?, ?, ?)",
    )
      .bind(sub.endpoint, sub.expirationTime, sub.keys.p256dh, sub.keys.auth)
      .run();
    return c.json({
      success: true,
    });
  },
);

subscriptions.openapi(
  createRoute({
    method: "post",
    path: "/test",
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
            }),
          },
        },
        description: "Test subscription",
      },
    },
  }),
  async (c) => {
    const { results } = (await c.env.D1_DB.prepare(
      "SELECT * FROM Subscriptions",
    ).run()) as { results: SubscriptionRow[] };

    console.log(results);

    const payload = JSON.stringify({
      title: "Push Working",
      body: "Notification from server",
      url: "/",
    });
    await Promise.allSettled(
      results.map((subscription) =>
        webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expiration_time,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh,
            },
          },
          payload,
        ),
      ),
    );

    return c.json({
      success: true,
    });
  },
);

export { subscriptions };
