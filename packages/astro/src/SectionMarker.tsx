import type { RectChangeMessage } from "@inhalt/schema";
import { useEffect, useRef, useState } from "react";

type SectionMarkerProps = {
  sectionId: string;
  sectionOrder: number;
};

export function SectionMarker({ sectionId, sectionOrder }: SectionMarkerProps) {
  const elRef = useRef<HTMLDivElement>(null);

  // Always up to date rect of the section
  // Send via postMessage to the parent window (editor)
  // Editor can use this to calculate position of tools (insert button etc.)
  const [rect, setRect] = useState<Omit<DOMRect, "toJSON"> | null>(null);
  const [section, setSection] = useState<Element | null>(null);

  useEffect(()=>{
    if (!section) {
      return;
    }

    const onChange = () => {
      const rect = section.getBoundingClientRect();

      const style = window.getComputedStyle(section);
      const marginLeft = parseFloat(style.marginLeft);
      const marginRight = parseFloat(style.marginRight);
      const marginTop = parseFloat(style.marginTop);
      const marginBottom = parseFloat(style.marginBottom);

      const height = section.scrollHeight + marginTop + marginBottom;
      const width = section.scrollWidth + marginLeft + marginRight;
      const top = rect.top - marginTop;
      const bottom = rect.bottom + marginBottom;
      const left = rect.left - marginLeft;
      const right = rect.right + marginRight;
      const x = rect.x - marginLeft;
      const y = rect.y - marginTop;

      setRect({
        height,
        width,
        top,
        bottom,
        left,
        right,
        x,
        y,
      });
    };

    const resizeObserver = new ResizeObserver(onChange);
    resizeObserver.observe(section);

     document.addEventListener("scroll", onChange);

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener("scroll", onChange);
    };
  },[section])

  useEffect(() => {
    if (!elRef.current) {
      return;
    }

    const section = elRef.current.parentElement?.nextElementSibling;
    if (section) {
      setSection(section);
    }
    
  }, [elRef.current]);

  useEffect(() => {
    if (!rect) {
      return;
    }

    window.top?.postMessage(
      {
        kind: "rect:change",
        sectionId,
        rect,
        order: sectionOrder,
      } satisfies RectChangeMessage,
      "*"
    );
  }, [rect]);

  return !section? <div ref={elRef} className="hidden" />:null;
}
