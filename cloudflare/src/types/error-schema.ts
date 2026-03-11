import z from "zod";

export const ErrorSchema = z.object({
  error: z.string(),
});
