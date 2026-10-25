import { collectJavaScriptOutputProse } from "./collect-output-prose/javascript-output.mjs";
import { collectJsxProse } from "./collect-output-prose/jsx.mjs";

export function collectOutputProse(value, blocks) {
  if (collectJsxProse(value, blocks) === false) return false;
  collectJavaScriptOutputProse(value, blocks);
}
