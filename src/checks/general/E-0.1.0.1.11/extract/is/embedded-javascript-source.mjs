import { parse } from "@babel/parser";

const sourceStatementTypes = new Set([
  "ClassDeclaration",
  "ExportDefaultDeclaration",
  "ExportNamedDeclaration",
  "FunctionDeclaration",
  "ImportDeclaration",
  "VariableDeclaration",
]);

export function isEmbeddedJavaScriptSource(templateText) {
  if (typeof templateText !== "string" || !templateText.includes("\n")) return false;
  try {
    const { body } = parse(templateText, { sourceType: "unambiguous" }).program;
    return body.some(({ type }) => sourceStatementTypes.has(type));
  } catch {
    return false;
  }
}
