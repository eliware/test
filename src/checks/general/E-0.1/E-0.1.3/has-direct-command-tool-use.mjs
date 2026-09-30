import { parseAllDocuments } from "yaml";

const command =
  /^\s*(?:(?:-\s*)?(?:run|command|script)\s*:\s*)?(?:[A-Z_][A-Z\d_]*=\S+\s+)*(?:(?:npx|npm\s+(?:exec|run))\s+(?:[^\s;&|]+\s+)*)?(?:jest|oxlint|prettier)(?=$|[\s"'`=:;,)&|])/im;
const commandFields = new Set(["run", "command", "script"]);

function containsCommand(node) {
  if (Array.isArray(node)) return node.some(containsCommand);
  if (!node || typeof node !== "object") return false;
  return Object.entries(node).some(([key, value]) =>
    commandFields.has(key) ? command.test(String(value)) : containsCommand(value),
  );
}

export function hasDirectCommandToolUse(file, content) {
  if (/\.ya?ml$/i.test(file))
    return parseAllDocuments(content).some((document) => containsCommand(document.toJS()));
  return command.test(content);
}
