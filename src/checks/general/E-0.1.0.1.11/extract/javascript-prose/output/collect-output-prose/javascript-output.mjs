import collectOutputCallProse from "./calls.mjs";
import collectOutputPropertyProse from "./properties.mjs";
import collectOutputAttributeProse from "./attributes.mjs";
export default function collectJavaScriptOutputProse(value, blocks) {
  if (value.type === "CallExpression") {
    collectOutputCallProse(value, blocks);
    collectOutputAttributeProse(value, blocks);
  }
  if (value.type === "AssignmentExpression") collectOutputPropertyProse(value, blocks);
}
