import { parse } from "@babel/parser";
import { collectJestTestNames } from "./collect-jest-test-names.mjs";
import { hasRegisteredJestTest } from "./has-registered-jest-test.mjs";
import { referencesTestSource } from "./references-test-source.mjs";
import { collectModuleShadowedNames } from "./collect-module-shadowed-jest-names.mjs";

export function inspectJestTestModule(content, testPath, sourcePath) {
  let ast;
  try {
    ast = parse(content, { sourceType: "module" });
  } catch {
    return { hasExecutableTest: false, importsSource: false };
  }
  const testNames = collectJestTestNames(ast.program);
  const callbackNames = findCallbackNames(ast.program);
  const moduleBindings = collectModuleShadowedNames(ast.program, testNames);
  return {
    hasExecutableTest: hasRegisteredJestTest(ast.program, {
      names: testNames,
      callbackNames,
      blockedTests: moduleBindings.tests,
      blockedCallbacks: moduleBindings.callbacks,
    }),
    importsSource: referencesTestSource(ast.program, testPath, sourcePath),
  };
}

function findCallbackNames(node, names = new Set()) {
  if (Array.isArray(node)) node.forEach((item) => findCallbackNames(item, names));
  else if (node && typeof node === "object") {
    if (node.type === "FunctionDeclaration" && node.id?.name) names.add(node.id.name);
    if (
      node.type === "VariableDeclarator" &&
      ["ArrowFunctionExpression", "FunctionExpression"].includes(node.init?.type) &&
      node.id?.type === "Identifier"
    )
      names.add(node.id.name);
    Object.values(node).forEach((item) => findCallbackNames(item, names));
  }
  return names;
}
