import { HonoBindings } from "../types/hono-bindings";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { env } from "cloudflare:workers";
import webpush from "web-push";
// 1. Import Drizzle dependencies
import { drizzle } from "drizzle-orm/d1";
import { subscriptions as subscriptionsTable } from "../db/schema"; // Renamed to avoid conflict

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
    security: [{ ApiKeyAuth: [] }],
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
            schema: z.object({ success: z.boolean() }),
          },
        },
        description: "Add subscription",
      },
    },
  }),
  async (c) => {
    const sub = await c.req.valid("json");

    // 2. Initialize Drizzle
    const db = drizzle(c.env.D1_DB);

    // 3. Use Drizzle Insert
    await db
      .insert(subscriptionsTable)
      .values({
        endpoint: sub.endpoint,
        expirationTime: sub.expirationTime,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      })
      .onConflictDoNothing(); // Good practice for duplicate endpoints

    return c.json({ success: true });
  },
);

subscriptions.openapi(
  createRoute({
    method: "post",
    path: "/test",
    security: [{ ApiKeyAuth: [] }],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({ success: z.boolean() }),
          },
        },
        description: "Test subscription",
      },
    },
  }),
  async (c) => {
    const db = drizzle(c.env.D1_DB);

    // 4. Use Drizzle Select
    const allSubscriptions = await db.select().from(subscriptionsTable);

    const payload = JSON.stringify({
      title: "Push Working",
      body: "Notification from server",
      url: "/",
    });

    await Promise.allSettled(
      allSubscriptions.map((subscription) =>
        webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh,
            },
          },
          payload,
          { urgency: "high", TTL: 60 * 60 * 24 },
        ),
      ),
    );

    return c.json({ success: true });
  },
);

// Note: The "/send" route follows the same logic as "/test" using db.select()
subscriptions.openapi(
  createRoute({
    method: "post",
    path: "/send",
    security: [{ ApiKeyAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              title: z.string(),
              body: z.string(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({ success: z.boolean() }),
          },
        },
        description: "Send push notification",
      },
    },
  }),
  async (c) => {
    const json = await c.req.valid("json");
    const db = drizzle(c.env.D1_DB);

    const allSubscriptions = await db.select().from(subscriptionsTable);

    const payload = JSON.stringify({
      title: json.title,
      body: json.body,
      url: "/",
    });

    await Promise.allSettled(
      allSubscriptions.map((subscription) =>
        webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh,
            },
          },
          payload,
          { urgency: "high", TTL: 60 * 60 * 24 },
        ),
      ),
    );

    return c.json({ success: true });
  },
);

export { subscriptions };
