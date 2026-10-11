import { parse } from "@babel/parser";

export function isPureExportBarrel(content) {
  let program;
  try {
    program = parse(content, { sourceType: "module" }).program;
  } catch {
    return false;
  }
  if (program.body.length === 0) return false;
  const imported = new Set();
  const exported = new Set();
  for (const node of program.body) {
    if (node.type === "ImportDeclaration") {
      if (node.specifiers.length === 0) return false;
      node.specifiers.forEach((specifier) => imported.add(specifier.local.name));
      continue;
    }
    if (node.type === "ExportAllDeclaration" && node.source) continue;
    if (node.type !== "ExportNamedDeclaration" || node.declaration) return false;
    // codescope ignore this because source re-exports are pure barrels by rule definition.
    if (node.source) continue;
    for (const specifier of node.specifiers) exported.add(specifier.local.name);
  }
  return (
    [...exported].every((name) => imported.has(name)) &&
    [...imported].every((name) => exported.has(name))
  );
}
