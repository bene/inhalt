import { initTRPC } from "@trpc/server";

export type Context = {
  caller: "internal";
};

const t = initTRPC.context<Context>().create();

export const { createCallerFactory } = t;
export const router = t.router;
export const publicProcedure = t.procedure;
