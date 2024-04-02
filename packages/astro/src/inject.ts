import type {
  MouseClickMessage,
  MouseMoveMessage,
  RectChangeMessage,
} from "@inhalt/schema";

type Section = {
  id: string;
  element: Element;
  order: number;
};

function updateRect(section: Section) {
  const element = section.element;
  const rect = element.getBoundingClientRect();

  const style = window.getComputedStyle(element);
  const marginLeft = parseFloat(style.marginLeft);
  const marginRight = parseFloat(style.marginRight);
  const marginTop = parseFloat(style.marginTop);
  const marginBottom = parseFloat(style.marginBottom);

  const height = element.scrollHeight + marginTop + marginBottom;
  const width = element.scrollWidth + marginLeft + marginRight;
  const top = rect.top - marginTop;
  const bottom = rect.bottom + marginBottom;
  const left = rect.left - marginLeft;
  const right = rect.right + marginRight;
  const x = rect.x - marginLeft;
  const y = rect.y - marginTop;

  const rectWithMargin = {
    height,
    width,
    top,
    bottom,
    left,
    right,
    x,
    y,
  };

  window.top?.postMessage(
    {
      kind: "rect:change",
      sectionId: section.id,
      order: section.order,
      rect: rectWithMargin,
    } satisfies RectChangeMessage,
    "*"
  );
}

// Get all sections
const sectionWrappers = document.querySelectorAll("inhalt-block");
const sections = Array.from(sectionWrappers)
  .filter((w) => w.firstElementChild)
  .map((w) => ({
    id: w.getAttribute("id"),
    element: w.firstElementChild,
    order: parseInt(w.getAttribute("order")!),
  })) as Section[];

// Send initial rects
sections.forEach(updateRect);

// Observe all sections for resize events
const resizeObserver = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    const section = sections.find((s) => s.element === entry.target);
    if (section) {
      updateRect(section);
    }
  });
});
sections.forEach((section) => {
  resizeObserver.observe(section.element);
});

// Update rects on scroll
document.addEventListener("scroll", () => {
  sections.forEach((section) => {
    updateRect(section);
  });
});

// Send click events to the parent window
window.addEventListener("mousedown", (e: MouseEvent) => {
  window.top?.postMessage(
    {
      kind: "mouse:click",
      x: e.clientX,
      y: e.clientY,
    } satisfies MouseClickMessage,
    "*"
  );
});

// Send mouse move events to the parent window
window.addEventListener("mousemove", (e) => {
  window.top?.postMessage(
    {
      kind: "mouse:move",
      x: e.clientX,
      y: e.clientY,
    } satisfies MouseMoveMessage,
    "*"
  );
});
