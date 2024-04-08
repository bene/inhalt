import { PlusIcon } from "@heroicons/react/24/outline";
import { Component, validateProps } from "@inhalt/schema";
import { useMutation } from "@tanstack/react-query";

import { trpc } from "../trpc";
import { AddComponentPanel } from "./AddComponentPanel";

type AddSectionToolProps = {
  insertIndex: number;
  pageId: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export function AddSectionTool({
  pageId,
  insertIndex,
  isOpen,
  setIsOpen,
}: AddSectionToolProps) {
  const { mutate: mutateAdd } = useMutation({
    onSuccess: () => setIsOpen(false),
    mutationFn: (args: Parameters<typeof trpc.pages.sections.add.mutate>[0]) =>
      trpc.pages.sections.add.mutate(args),
  });

  const onSubmit = (component: Component, value: unknown) => {
    const props = validateProps(component.propsSchema, value);

    mutateAdd({
      pageId,
      at: insertIndex,
      section: {
        componentName: component.name,
        props,
      },
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 rounded-full bg-white shadow"
      >
        <PlusIcon className="h-6 w-6 text-gray-500" />
      </button>

      <AddComponentPanel
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onSubmit={onSubmit}
      />
    </>
  );
}
