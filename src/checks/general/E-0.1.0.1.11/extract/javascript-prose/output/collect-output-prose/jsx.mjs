import { isUserFacingAttribute } from "../attributes.mjs";
import { addOutputProseBlocks } from "./blocks.mjs";

export function collectJsxProse(value, blocks) {
  if (value.type === "JSXText") {
    addOutputProseBlocks(value.value, value.loc.start.line, blocks);
    return false;
  }
  if (value.type !== "JSXAttribute") return undefined;
  if (isUserFacingAttribute(value.name?.name)) {
    const expression =
      value.value?.type === "JSXExpressionContainer" ? value.value.expression : value.value;
    addOutputProseBlocks(expression, value.loc.start.line, blocks);
  }
  return false;
}
