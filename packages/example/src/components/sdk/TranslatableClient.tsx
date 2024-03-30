import clsx from "clsx";
import { useRef, useState } from "react";

export type TranslatableProps = {
  key: string;
  text: string | null;
};

export function TranslatableClient({ text }: TranslatableProps) {
  const pElRef = useRef<HTMLParagraphElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <p
      className="group relative"
      ref={pElRef}
      onBlur={() => setIsEditing(false)}
      contentEditable={isEditing}
    >
      {text ?? "No text provided"}

      <button
        onClick={() => setIsEditing(true)}
        className={clsx(
          isEditing && "hidden",
          "opacity-0 transition-opacity group-hover:opacity-45 absolute inset-0 z-10 bg-blue-500"
        )}
      />
    </p>
  );
}
