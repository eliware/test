import { parseAllDocuments } from "yaml";
import { collectYamlProse } from "./yaml-prose/collect-prose.mjs";

export function extractYamlProse(source) {
  const blocks = [];
  for (const document of parseAllDocuments(source)) {
    if (document.errors.length) continue;
    blocks.push(...collectYamlProse(source, document.contents));
  }
  return blocks;
}
