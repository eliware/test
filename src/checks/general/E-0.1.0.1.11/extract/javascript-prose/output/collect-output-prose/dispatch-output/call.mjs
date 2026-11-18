import collectOutputCallProse from "../calls.mjs";
import collectOutputAttributeProse from "../attributes.mjs";
export default function dispatchOutputCall(value, blocks) {
  if (value.type !== "CallExpression") return;
  collectOutputCallProse(value, blocks);
  collectOutputAttributeProse(value, blocks);
}
