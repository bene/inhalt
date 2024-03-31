import clsx from "clsx";
import { useEffect, useRef } from "react";

type AddSectionToolProps = {
  showAlways?: boolean;
  insertIndex: number;
};

export function AddSectionTool({
  showAlways,
  insertIndex,
}: AddSectionToolProps) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws?kind=add-section-tool");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected");
    };
    ws.onmessage = (event) => {
      console.log(`Message from server: ${event.data}`);
    };
    ws.onclose = () => {
      console.log("Disconnected");
    };

    return () => ws.close();
  }, []);

  const onClick = () => {
    wsRef.current?.send(
      JSON.stringify({
        type: "add-section",
        payload: {
          insertIndex,
        },
      })
    );
  };

  return (
    <div className="w-screen h-0">
      <div className="group -translate-y-1/2 h-10 flex items-center justify-center">
        <div
          className={clsx(
            showAlways
              ? "bg-gray-200"
              : "bg-transparent group-hover:bg-gray-200",
            "basis-0 flex-1 h-[1px]"
          )}
        />
        <button
          className={clsx(
            showAlways ? "block" : "hidden group-hover:block",
            "rounded-full aspect-square border px-3 hover:bg-gray-50 transition-colors text-gray-800"
          )}
          onClick={onClick}
        >
          +
        </button>
        <div
          className={clsx(
            showAlways
              ? "bg-gray-200"
              : "bg-transparent group-hover:bg-gray-200",
            "basis-0 flex-1 h-[1px]"
          )}
        />
      </div>
    </div>
  );
}
