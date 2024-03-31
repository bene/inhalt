import { useEffect, useRef, useState } from "react";
import { AddSectionTool } from "../components/AddSectionTool";
import { useSections } from "../hooks/useSectionts";

const page = {
  id: "45d05b20-8651-42e5-b41d-3b7cd533d73c",
  slug: "index",
};

export function Editor() {
  const sections = useSections();

  // State
  const [insertIndex, setInsertIndex] = useState(0);
  const [isToolOpen, setIsToolOpen] = useState(false);

  // DOM refs
  const iframeEl = useRef<HTMLIFrameElement>(null);
  const indicatorEl = useRef<HTMLDivElement>(null);
  const addSectionToolEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!iframeEl.current || isToolOpen) {
        return;
      }

      const iframeRect = iframeEl.current.getBoundingClientRect();
      const x = e.clientX - iframeRect.left;
      const y = e.clientY - iframeRect.top;

      const sectionId = Array.from(sections.keys()).find((sectionId) => {
        const rect = sections.get(sectionId)!.rect;
        return (
          x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
        );
      });

      if (sectionId) {
        const { rect, order } = sections.get(sectionId)!;

        indicatorEl.current!.classList.remove("hidden");
        indicatorEl.current!.style.left = `${rect.left}px`;
        indicatorEl.current!.style.top = `${rect.top}px`;
        indicatorEl.current!.style.width = `${rect.width}px`;
        indicatorEl.current!.style.height = `${rect.height}px`;

        if (y < rect.top + 20) {
          addSectionToolEl.current?.classList.remove("hidden");
          addSectionToolEl.current!.style.top = `${rect.top}px`;
          setInsertIndex(order);
        } else if (y > rect.top + rect.height - 20) {
          addSectionToolEl.current?.classList.remove("hidden");
          addSectionToolEl.current!.style.top = `${rect.top + rect.height}px`;
          setInsertIndex(order + 1);
        } else {
          addSectionToolEl.current!.classList.add("hidden");
        }
      } else {
        indicatorEl.current!.classList.add("hidden");
      }
    };

    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [isToolOpen, sections]);

  useEffect(() => {
    if (!isToolOpen) {
      indicatorEl.current?.classList.add("hidden");
      addSectionToolEl.current?.classList.add("hidden");
    }
  }, [isToolOpen]);

  return (
    <div className="w-[100dvw] h-[100dvh] flex flex-col bg-gray-50">
      <div className="h-12 flex p-4 items-center justify-between">
        <p className="font-bold text-lg">Home</p>
        <button className="bg-black rounded-lg shadow px-3 py-1 text-white">
          Save
        </button>
      </div>

      <div className="flex-1 px-4 pb-4">
        <div className="relative overflow-hidden rounded-xl shadow-xl w-full h-full bg-white">
          <div
            ref={indicatorEl}
            className="absolute bg-gray-200 rounded opacity-25"
          />
          <div className="absolute inset-0 z-10 bg-transparent flex">
            <div className="flex-1 relative">
              <div
                ref={addSectionToolEl}
                className="absolute inset-x-0 w-screen h-0"
              >
                <AddSectionTool
                  isOpen={isToolOpen}
                  setIsOpen={setIsToolOpen}
                  insertIndex={insertIndex}
                  pageId={page.id}
                  showAlways
                />
              </div>
            </div>
          </div>
          <div className="absolute inset-0">
            <iframe
              ref={iframeEl}
              src={`http://localhost:4321/${page.slug === "index" ? "" : page.slug}`}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
