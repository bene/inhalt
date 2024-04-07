import { realtimeMessage } from "@inhalt/schema";
import { useEffect, useState } from "react";

export function useContainer() {
  const [container, setContainer] = useState<Omit<DOMRect, "toJSON"> | null>(
    null
  );

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const res = realtimeMessage.safeParse(e.data);
      if (!res.success) {
        return;
      }

      const msg = res.data;

      if (msg.kind === "rect:change" && msg.target === "container") {
        setContainer(msg.rect);
        console.log("container", msg.rect);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return container;
}
