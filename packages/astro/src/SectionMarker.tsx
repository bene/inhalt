import { useEffect, useRef, useState } from "react";

type SectionMarkerProps = {
  sectionId: string;
};

export function SectionMarker({ sectionId }: SectionMarkerProps) {
  const elRef = useRef<HTMLDivElement>(null);

  // Always up to date rect of the section
  // Send via postMessage to the parent window (editor)
  // Editor can use this to calculate position of tools (insert button etc.)
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!elRef.current) {
      return;
    }

    const section = elRef.current.parentElement?.nextElementSibling;
    if (!section) {
      return;
    }

    const onChange = () => {
      setRect(section.getBoundingClientRect());
    };

    const resizeObserver = new ResizeObserver(onChange);
    resizeObserver.observe(section);

    document.addEventListener("scroll", onChange);

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener("scroll", onChange);
    };
  }, []);

  return (
    <div ref={elRef} className="hidden" data-inhalt-marker-for={sectionId} />
  );
}
