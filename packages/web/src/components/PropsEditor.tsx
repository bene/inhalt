import { Component } from "@inhalt/schema";
import { PropsWithChildren } from "react";

import { getHumanTypeName } from "../utils";

type PropsEditorProps = PropsWithChildren<{
  component: Component;
  onSubmit: (value: unknown) => void;
}>;

export function PropsEditor({
  children,
  component,
  onSubmit,
}: PropsEditorProps) {
  return component.propsSchema ? (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(
          Object.fromEntries(
            Array.from(e.currentTarget.elements)
              .filter((el) => el instanceof HTMLInputElement)
              .map((el) => [el.id, (el as HTMLInputElement).value])
          )
        );
      }}
      className="flex flex-col gap-4"
    >
      {Object.entries(component.propsSchema).map(([name, value]) => (
        <div key={name}>
          <label htmlFor={name} className="text-gray-500">
            {name}
          </label>
          <input
            id={name}
            required={value.required}
            type="text"
            className="mt-1 w-full border-gray-200 rounded-md focus:ring-pink-800 focus:border-pink-800"
            placeholder={getHumanTypeName(value.type)}
          />
        </div>
      ))}

      {children}
    </form>
  ) : (
    <div className="rounded border border-dashed flex items-center justify-center min-h-40">
      <div className="p-4 text-center text-gray-500">
        <span className="font-bold">{component.name}</span> has no editable
        props.
      </div>
    </div>
  );
}
