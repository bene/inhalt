type SectionMarkerProps = {
  sectionId: string;
};

export function SectionMarker({ sectionId }: SectionMarkerProps) {
  // Go get the section get the element before this in the DOM
  return <div className="hidden" data-inhalt-marker-for={sectionId} />;
}
