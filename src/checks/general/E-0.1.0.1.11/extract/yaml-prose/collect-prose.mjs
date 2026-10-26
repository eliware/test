import { visitYamlScalars } from "./collect.mjs";
import { isYamlDirectiveField } from "./directive-fields.mjs";
import { isYamlExamplePath } from "./examples.mjs";
import { isYamlProseField } from "./prose-fields.mjs";

export function collectYamlProse(source, root) {
  const blocks = [];
  visitYamlScalars(root, (node, path) => {
    if (isYamlExamplePath(path)) return;
    const field = path.at(-1);
    if (typeof node.value !== "string") return;
    const directive = isYamlDirectiveField(field, path);
    if (!directive && !isYamlProseField(field)) return;
    const start = node.range[0];
    const line = source.slice(0, start).split(/\r\n|\n|\r/u).length;
    blocks.push({ text: node.value, line, kind: directive ? "directive" : "prose" });
  });
  return blocks;
}
