import {
  componentValidator,
  type Component,
  type UpdatePageMessage,
} from "@inhalt/schema";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { z } from "zod";

type AddSectionToolProps = {
  showAlways?: boolean;
  insertIndex: number;
  pageId: string;
};

export function AddSectionTool({
  showAlways,
  insertIndex,
  pageId,
}: AddSectionToolProps) {
  const [show, setShow] = useState(false);
  const [components, setComponents] = useState<Component[]>([]);

  useEffect(() => {
    const ac = new AbortController();

    const fetchComponentNames = async () => {
      const res = await fetch("http://localhost:3000/components", {
        signal: ac.signal,
      });
      const raw = await res.json();
      const components = z.array(componentValidator).parse(raw);

      setComponents(components);
    };

    fetchComponentNames();

    return () => ac.abort();
  }, []);

  const onClick = () => {
    console.log("Add section at index", insertIndex);
  };

  return (
    <div className="w-screen h-0">
      <div
        className={clsx(
          !showAlways && "-translate-y-1/2",
          "group h-10 flex items-center justify-center"
        )}
      >
        <div
          className={clsx(
            show || showAlways
              ? "bg-gray-200"
              : "bg-transparent group-hover:bg-gray-200",
            "basis-0 flex-1 h-[1px]"
          )}
        />
        <button
          className={clsx(
            show || showAlways ? "block" : "hidden group-hover:block",
            "rounded-full aspect-square border px-3 hover:bg-gray-50 transition-colors text-gray-800"
          )}
          onClick={() => setShow(true)}
        >
          +
        </button>
        <div
          className={clsx(
            show || showAlways
              ? "bg-gray-200"
              : "bg-transparent group-hover:bg-gray-200",
            "basis-0 flex-1 h-[1px]"
          )}
        />
      </div>

      <div
        className={clsx(
          show ? "flex" : "hidden",
          "z-50 -translate-y-5 flex-col divide-y max-h-80 overflow-scroll w-60 bg-white shadow rounded-xl mx-auto"
        )}
      >
        {components.map((component) => (
          <div key={component.name} className="p-1">
            <button
              onClick={() => {
                fetch(`http://localhost:3000/page/${pageId}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    kind: "page:update",
                    pageId,
                    updates: [
                      {
                        operation: "add",
                        order: insertIndex,
                        componentName: component.name,
                        props: null,
                      },
                    ],
                  } satisfies UpdatePageMessage),
                });
              }}
              className="rounded hover:bg-gray-50 w-full text-start text-gray-800 px-4 py-2"
            >
              {component.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
