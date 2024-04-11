import { appRouter } from "./index";
import { createCallerFactory } from "./trpc";

let internalCaller: ReturnType<
  ReturnType<typeof createCallerFactory<typeof appRouter>>
>;

export const caller = {
  get internal() {
    if (!internalCaller) {
      internalCaller = createCallerFactory(appRouter)({
        caller: "internal",
      });
    }
    return internalCaller;
  },
};
