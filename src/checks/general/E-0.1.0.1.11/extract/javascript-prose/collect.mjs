import collectOutputProse from "./output/collect-output-prose.mjs";
import visitJavaScriptProse from "./visit-javascript-prose.mjs";
export default function collectJavaScriptProse(root) {
  const blocks = [];
  visitJavaScriptProse(root, (value) => collectOutputProse(value, blocks));
  return blocks;
}
