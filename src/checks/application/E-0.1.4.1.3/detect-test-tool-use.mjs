import { parse } from "@babel/parser";
import { collectLauncherAliases, isLauncher } from "./collect-launcher-aliases.mjs";
import { readStaticString } from "./read-static-string.mjs";
import { visitAst } from "./visit-ast.mjs";
import { isModuleLoadCall } from "./is-module-load-call.mjs";
import { isTestToolCommand, isTestToolSpecifier } from "./test-tool-patterns.mjs";
export function detectTestToolUse(content, allowHarnessTools = false) {
  let ast;
  try {
    ast = parse(content, {
      sourceType: "unambiguous",
      errorRecovery: true,
      plugins: ["jsx", "typescript"],
    });
  } catch {
    return true;
  }
  const strings = collectStaticStrings(ast.program);
  const launchNames = collectLauncherAliases(ast.program);
  return visitAst(ast.program, (node) => {
    const specifier = importSpecifier(node, strings);
    if (
      specifier &&
      isTestToolSpecifier(specifier) &&
      !(allowHarnessTools && specifier === "istanbul-lib-instrument")
    )
      return true;
    if (
      isModuleLoadCall(node) &&
      node.arguments.some((argument) =>
        isTestToolSpecifier(readStaticString(argument, strings) ?? ""),
      )
    )
      return true;
    if (node.type === "CallExpression" && isLauncher(node.callee, launchNames)) {
      const command = node.arguments
        .flatMap((argument) => collectStrings(argument, strings))
        .join(" ");
      if (isTestToolCommand(command, allowHarnessTools)) return true;
    }
    return false;
  });
}

function collectStaticStrings(root) {
  const strings = new Map();
  visitAst(root, (node) => {
    if (["VariableDeclarator", "AssignmentExpression"].includes(node.type)) {
      const binding = node.id ?? node.left;
      const value = readStaticString(node.init ?? node.right, strings);
      if (binding?.type === "Identifier" && value !== null) strings.set(binding.name, value);
    }
    return false;
  });
  return strings;
}

function importSpecifier(node, strings) {
  if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type))
    return readStaticString(node.source, strings);
  if (node.type === "ImportExpression") return readStaticString(node.source, strings);
  return null;
}

function collectStrings(node, strings) {
  const value = readStaticString(node, strings);
  if (value !== null) return [value];
  if (Array.isArray(node)) return node.flatMap((item) => collectStrings(item, strings));
  if (node && typeof node === "object")
    return Object.values(node).flatMap((item) => collectStrings(item, strings));
  return [];
}
