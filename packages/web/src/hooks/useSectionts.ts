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
    window.onmessage = (e) => {
      const res = realtimeMessage.safeParse(e.data);
      if (!res.success) {
        return;
      }

      const msg = res.data;

      if (msg.kind === "rect:change") {
        setSections((prev) => {
          const newRects = new Map(prev);
          newRects.set(msg.sectionId, {
            rect: msg.rect,
            order: msg.order,
          });
          return newRects;
        });
      }
    };
  }, []);

  return sections;
}
