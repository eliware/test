import { parse } from "@babel/parser";
import { collectLauncherAliases, isLauncher } from "./collect-launcher-aliases.mjs";
import { readStaticString } from "./read-static-string.mjs";
import { visitAst } from "./visit-ast.mjs";
import { isModuleLoadCall } from "./is-module-load-call.mjs";
import { isTestToolCommand, isTestToolSpecifier } from "./test-tool-patterns.mjs";
import { collectCommandStrings } from "./analyze/collect/command-strings.mjs";
import { collectStaticStrings } from "./analyze/collect/static-strings.mjs";
import { findImportSpecifier } from "./analyze/find-import-specifier.mjs";

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
    const specifier = findImportSpecifier(node, strings);
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
      const command = collectCommandStrings(node.arguments, strings).join(" ");
      if (isTestToolCommand(command, allowHarnessTools)) return true;
    }
    return false;
  });
}
