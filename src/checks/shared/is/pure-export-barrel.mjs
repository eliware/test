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
  let hasStarExport = false;
  let hasLocalExport = false;
  for (const node of program.body) {
    if (node.type === "ImportDeclaration") {
      if (node.specifiers.length === 0) return false;
      node.specifiers.forEach((specifier) => imported.add(specifier.local.name));
      continue;
    }
    if (node.type === "ExportAllDeclaration" && node.source) {
      hasStarExport = true;
      continue;
    }
    if (node.type !== "ExportNamedDeclaration" || node.declaration) return false;
    if (node.source) continue;
    for (const specifier of node.specifiers) {
      hasLocalExport = true;
      exported.add(specifier.local.name);
    }
  }
  return (
    !(hasStarExport && hasLocalExport) &&
    [...exported].every((name) => imported.has(name)) &&
    [...imported].every((name) => exported.has(name))
  );
}
