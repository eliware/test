import { parseAllDocuments } from "yaml";
import collectYamlProse from "./collect-prose.mjs";

export default function extractYamlDocumentsProse(source) {
  const blocks = [];
  for (const document of parseAllDocuments(source)) {
    if (document.errors.length) continue;
    blocks.push(...collectYamlProse(source, document.contents));
  }
  return blocks;
}
