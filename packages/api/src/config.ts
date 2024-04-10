import { z } from "zod";

const configValidator = z
  .object({
    PUBLIC_URL: z.string().url(),
  })
  .transform((config) => ({
    publicUrl: new URL(config.PUBLIC_URL),
  }));

export const config = Object.freeze(
  configValidator.parse({
    PUBLIC_URL: import.meta.env.PUBLIC_URL,
  })
);
