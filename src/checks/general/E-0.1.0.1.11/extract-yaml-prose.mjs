import { isMap, isScalar, isSeq, parseAllDocuments } from "yaml";

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
    visit(document.contents, [], source, blocks);
  }
  return blocks;
}

function visit(node, path, source, blocks) {
  if (isMap(node)) {
    for (const item of node.items) {
      const key = String(item.key.value).toLowerCase();
      if (key === "examples") continue;
      visit(item.value, [...path, key], source, blocks);
    }
    return;
  }
  if (isSeq(node)) {
    for (const item of node.items) visit(item, path, source, blocks);
    return;
  }
  if (!isScalar(node) || typeof node.value !== "string") return;
  const field = path.at(-1);
  const directive = ["dos", "donts"].includes(field) && path.includes("directives");
  if (!directive && !proseFields.has(field)) return;
  const start = node.range[0];
  const line = source.slice(0, start).split(/\r\n|\n|\r/u).length;
  blocks.push({ text: node.value, line, kind: directive ? "directive" : "prose" });
}
