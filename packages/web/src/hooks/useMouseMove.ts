import { realtimeMessage } from "@inhalt/schema";
import { useEffect, useState } from "react";

export function useMouseMove() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const res = realtimeMessage.safeParse(e.data);
      if (!res.success) {
        return;
      }

      const msg = res.data;

      if (msg.kind === "mouse:move") {
        setX(msg.x);
        setY(msg.y);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return { x, y };
}
