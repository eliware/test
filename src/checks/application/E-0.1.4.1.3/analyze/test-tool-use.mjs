import { collectLauncherAliases } from "../collect-launcher-aliases.mjs";
import { isLauncher } from "../is/launcher.mjs";
import { readStaticString } from "../read-static-string.mjs";
import { visitAst } from "../visit-ast.mjs";
import { isModuleLoadCall } from "../is/module-load-call.mjs";
import { isTestToolCommand, isTestToolSpecifier } from "../test-tool-patterns.mjs";
import { collectCommandStrings } from "./collect/command-strings.mjs";
import { collectStaticStrings } from "./collect/static-strings.mjs";
import { findImportSpecifier } from "./find-import-specifier.mjs";

export function analyzeTestToolUse(program, allowHarnessTools = false) {
  const strings = collectStaticStrings(program);
  const launchNames = collectLauncherAliases(program);
  return visitAst(program, (node) => {
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
