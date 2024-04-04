import { useEffect, useRef, useState } from "react";

import {
  AdjustmentsHorizontalIcon,
  ArrowLeftIcon,
  ChatBubbleBottomCenterIcon,
} from "@heroicons/react/24/outline";
import { Link } from "@tanstack/react-router";

import { useMouseClick } from "../hooks/useMouseClick";
import { useMouseMove } from "../hooks/useMouseMove";
import { useSections } from "../hooks/useSectionts";
import { AddSectionTool } from "./AddSectionTool";
import { PropsEditorPanel } from "./PropsEditorPanel";

type EditorProps = {
  page: {
    id: string;
    slug: string;
  };
};

export function Editor({ page }: EditorProps) {
  // State
  const [insertIndex, setInsertIndex] = useState(0);
  const [isToolOpen, setIsToolOpen] = useState(false);
  const [isPropsEditorOpen, setIsPropsEditorOpen] = useState(false);
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);

  // Editor related hooks
  const sections = useSections();
  const mousePosition = useMouseMove();
  useMouseClick(() => {
    setIsPropsEditorOpen(true);
  });

  // DOM refs
  const iframeEl = useRef<HTMLIFrameElement>(null);
  const indicatorEl = useRef<HTMLDivElement>(null);
  const addSectionToolEl = useRef<HTMLDivElement>(null);

  const resetTools = () => {
    setIsToolOpen(false);
    setHoveredSectionId(null);
    indicatorEl.current?.classList.add("hidden");
    addSectionToolEl.current?.classList.add("hidden");
  };

  // Hide tools when props editor or toolbar is closed
  useEffect(() => {
    if (!isPropsEditorOpen && !isToolOpen) {
      resetTools();
    }
  }, [isToolOpen, isPropsEditorOpen]);

  useEffect(() => {
    if (!iframeEl.current || isToolOpen || isPropsEditorOpen) {
      return;
    }

    const iframeRect = iframeEl.current.getBoundingClientRect();
    const x = mousePosition.x - iframeRect.left;
    const y = mousePosition.y - iframeRect.top;

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
        addSectionToolEl.current!.style.top = `${rect.top - 0.5}px`;
        setInsertIndex(order);
      } else if (y > rect.top + rect.height - 20) {
        addSectionToolEl.current?.classList.remove("hidden");
        addSectionToolEl.current!.style.top = `${rect.top + rect.height + 0.5}px`;
        setInsertIndex(order + 1);
      } else {
        addSectionToolEl.current!.classList.add("hidden");
      }

      setHoveredSectionId(sectionId);
    } else {
      indicatorEl.current!.classList.add("hidden");
    }
  }, [isPropsEditorOpen, isToolOpen, mousePosition, sections]);

  return (
    <>
      <PropsEditorPanel
        sectionId={hoveredSectionId}
        isOpen={isPropsEditorOpen}
        setIsOpen={setIsPropsEditorOpen}
      />

      <div className="fixed inset-x-0 top-0 flex justify-center z-30">
        <div className="group -translate-y-[calc(50%+16px)] hover:translate-y-0 pt-4 transition-transform">
          <div className="py-3 px-6 gap-6 bg-black rounded-full shadow-md flex justify-center items-center">
            <Link to="/">
              <ArrowLeftIcon className="h-6 w-6 transition-colors group-hover:text-white" />
            </Link>

            <ChatBubbleBottomCenterIcon className="h-6 w-6 transition-colors group-hover:text-white" />
            <AdjustmentsHorizontalIcon className="h-6 w-6 transition-colors group-hover:text-white" />
          </div>
        </div>
      </div>

      <div className="relative w-[100dvw] h-[100dvh]">
        <div
          ref={indicatorEl}
          className="fixed z-10 border-2 border-dashed border-pink-800 bg-opacity-10 bg-pink-800 pointer-events-none"
        />

        <div
          ref={addSectionToolEl}
          className="absolute inset-x-0 flex justify-center items-center w-screen h-0 z-20"
        >
          <AddSectionTool
            isOpen={isToolOpen}
            setIsOpen={setIsToolOpen}
            insertIndex={insertIndex}
            pageId={page.id}
            showAlways
          />
        </div>

        <div className="absolute inset-0">
          <iframe
            ref={iframeEl}
            src={`http://localhost:4321/${page.slug === "index" ? "" : page.slug}`}
            className="w-full h-full"
          />
        </div>
      </div>
    </>
  );
}
