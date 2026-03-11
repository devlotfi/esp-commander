import { z } from "zod";

export interface SubscriptionRow {
  endpoint: string;
  expiration_time: number | null;
  p256dh: string;
  auth: string;
  created_at?: number;
}
