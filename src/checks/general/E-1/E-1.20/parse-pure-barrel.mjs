import { parse } from "@babel/parser";

export function isPureBarrelSource(source) {
  const { program } = parse(source, { sourceType: "module", plugins: ["importAttributes"] });
  if (program.directives.length > 0) return false;
  let hasExport = false;
  for (const statement of program.body) {
    if (statement.type === "ImportDeclaration") {
      if (statement.specifiers.length === 0) return false;
      continue;
    }
    if (statement.type === "ExportAllDeclaration") {
      hasExport = true;
      continue;
    }
    if (statement.type !== "ExportNamedDeclaration" || statement.declaration) return false;
    if (!statement.specifiers.length) return false;
    hasExport = true;
  }
  return hasExport;
}
