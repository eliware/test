import { isScalar, parseAllDocuments } from "yaml";
import { visitYamlScalars } from "./yaml-prose/collect.mjs";
import { isYamlDirectiveField } from "./yaml-prose/directive-fields.mjs";
import { isYamlExamplePath } from "./yaml-prose/examples.mjs";
import { isYamlProseField } from "./yaml-prose/prose-fields.mjs";

export function extractYamlProse(source) {
  const blocks = [];
  for (const document of parseAllDocuments(source)) {
    if (document.errors.length) continue;
    visitYamlScalars(document.contents, (node, path) => {
      if (isYamlExamplePath(path)) return;
      const field = path.at(-1);
      if (!isScalar(node) || typeof node.value !== "string") return;
      const directive = isYamlDirectiveField(field, path);
      if (!directive && !isYamlProseField(field)) return;
      const start = node.range[0];
      const line = source.slice(0, start).split(/\r\n|\n|\r/u).length;
      blocks.push({ text: node.value, line, kind: directive ? "directive" : "prose" });
    });
  }
  return blocks;
}
