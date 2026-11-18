import { isMap, isScalar, isSeq } from "yaml";
import extractMarkdownProse from "../extract/markdown-prose.mjs";
import normalizeSentence from "../word-tools/normalize-sentence.mjs";
import splitSentences from "../word-tools/split-sentences.mjs";
export default function collectExactExamples(node, exact) {
  if (isMap(node)) {
    for (const item of node.items) {
      if (String(item.key.value).toLowerCase() === "examples") collectText(item.value, exact);
      else collectExactExamples(item.value, exact);
    }
  } else if (isSeq(node)) {
    for (const item of node.items) collectExactExamples(item, exact);
  }
}
function collectText(node, exact) {
  if (isScalar(node) && typeof node.value === "string") {
    const blocks = extractMarkdownProse(node.value);
    for (const block of blocks)
      for (const sentence of splitSentences(block.text)) exact.add(normalizeSentence(sentence));
    return;
  }
  if (isSeq(node)) for (const item of node.items) collectText(item, exact);
  if (isMap(node)) for (const item of node.items) collectText(item.value, exact);
}
