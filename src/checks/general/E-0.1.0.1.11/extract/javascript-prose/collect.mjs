import { collectOutputProse } from "./output/collect-output-prose.mjs";
import { visitJavaScriptProse } from "./visit-javascript-prose.mjs";

export function collectJavaScriptProse(root) {
  const blocks = [];
  visitJavaScriptProse(root, (value) => collectOutputProse(value, blocks));
  return blocks;
}
