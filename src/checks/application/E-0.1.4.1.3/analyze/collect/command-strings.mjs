import { readStaticString } from "../../read-static-string.mjs";

export function collectCommandStrings(node, strings) {
  const value = readStaticString(node, strings);
  if (value !== null) return [value];
  if (Array.isArray(node)) return node.flatMap((item) => collectCommandStrings(item, strings));
  if (node && typeof node === "object")
    return Object.values(node).flatMap((item) => collectCommandStrings(item, strings));
  return [];
}
