import clsx from "clsx";

type AddSectionToolProps = {
  showAlways?: boolean;
  insertIndex: number;
};

export function AddSectionTool({
  showAlways,
  insertIndex,
}: AddSectionToolProps) {
  const onClick = () => {};

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
