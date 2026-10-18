import { isScalar, parseAllDocuments } from "yaml";
import { visitYamlScalars } from "./yaml-prose/collect.mjs";

const proseFields = new Set([
  "description",
  "title",
  "purpose",
  "owner",
  "boundaries",
  "prerequisites",
  "steps",
  "prompt",
  "message",
  "help",
  "summary",
  "note",
  "notes",
  "support",
  "result",
  "expected",
  "scope",
  "acceptance",
  "content",
]);

export function extractYamlProse(source) {
  const blocks = [];
  for (const document of parseAllDocuments(source)) {
    if (document.errors.length) continue;
    visitYamlScalars(document.contents, (node, path) => {
      if (path.includes("examples")) return;
      const field = path.at(-1);
      if (!isScalar(node) || typeof node.value !== "string") return;
      const directive = ["dos", "donts"].includes(field) && path.includes("directives");
      if (!directive && !proseFields.has(field)) return;
      const start = node.range[0];
      const line = source.slice(0, start).split(/\r\n|\n|\r/u).length;
      blocks.push({ text: node.value, line, kind: directive ? "directive" : "prose" });
    });
  }
  return blocks;
}
