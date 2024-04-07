import { realtimeMessage } from "@inhalt/schema";
import { useEffect, useState } from "react";

export function useSections() {
  const [sections, setSections] = useState(
    new Map<
      string,
      {
        rect: Omit<DOMRect, "toJSON">;
        order: number;
      }
    >()
  );

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const res = realtimeMessage.safeParse(e.data);
      if (!res.success) {
        return;
      }

      const msg = res.data;

      if (msg.kind === "rect:change" && msg.target !== "container") {
        setSections((prev) => {
          const newRects = new Map(prev);
          // https://github.com/colinhacks/zod/issues/2203
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newRects.set((msg.target as any).sectionId, {
            rect: msg.rect,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            order: (msg.target as any).order,
          });
          return newRects;
        });
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return sections;
}
