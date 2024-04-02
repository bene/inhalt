import { MouseClickMessage, realtimeMessage } from "@inhalt/schema";
import { useEffect } from "react";

export function useMouseClick(onClick: (e: MouseClickMessage) => void) {
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const res = realtimeMessage.safeParse(e.data);
      if (!res.success) {
        return;
      }

      const msg = res.data;

      if (msg.kind === "mouse:click") {
        onClick(msg);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onClick]);
}
