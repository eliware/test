import readStaticString from "../../../read-static-string.mjs";
import isModuleLoadCall from "../../../is/module-load-call.mjs";
import isTestToolSpecifier from "../../../test-tool-patterns.mjs";
import findImportSpecifier from "../../find-import-specifier.mjs";

export default function isProhibitedTestToolImport(node, strings, allowHarnessTools) {
  const specifier = findImportSpecifier(node, strings);
  if (
    specifier &&
    isTestToolSpecifier(specifier) &&
    !(allowHarnessTools && specifier === "istanbul-lib-instrument")
  )
    return true;
  return (
    isModuleLoadCall(node) &&
    node.arguments.some((argument) =>
      isTestToolSpecifier(readStaticString(argument, strings) ?? ""),
    )
  );
}
