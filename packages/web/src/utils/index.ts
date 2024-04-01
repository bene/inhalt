import { PropType } from "@inhalt/schema";

export function getHumanTypeName(typeD: PropType) {
  switch (typeD) {
    case "string":
      return "Text";
    case "number":
      return "Number";
    case "boolean":
      return "Boolean";
  }
}
