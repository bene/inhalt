import { PlusIcon } from "@heroicons/react/24/outline";
import { AddComponentPanel } from "./AddComponentPanel";

type AddSectionToolProps = {
  insertIndex: number;
  pageId: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export function AddSectionTool({ isOpen, setIsOpen }: AddSectionToolProps) {
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 rounded-full bg-white"
      >
        <PlusIcon className="h-6 w-6 text-gray-500" />
      </button>

      <AddComponentPanel isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  );
}
