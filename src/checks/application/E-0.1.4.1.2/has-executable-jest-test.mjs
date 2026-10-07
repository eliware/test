import { parse } from "@babel/parser";
import { collectJestTestNames } from "./collect-jest-test-names.mjs";
import { isActiveJestTestExpression } from "./is-active-jest-test-expression.mjs";
import { referencesTestSource } from "./references-test-source.mjs";
import { collectShadowedJestNames } from "./collect-shadowed-jest-names.mjs";
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
    hasExecutableTest: containsTestCall(
      ast.program,
      testNames,
      callbackNames,
      moduleBindings.tests,
      moduleBindings.callbacks,
    ),
    importsSource: referencesTestSource(ast.program, testPath, sourcePath),
  };
}

function containsTestCall(node, names, callbackNames, blockedTests, blockedCallbacks) {
  if (Array.isArray(node))
    return node.some((item) =>
      containsTestCall(item, names, callbackNames, blockedTests, blockedCallbacks),
    );
  if (!node || typeof node !== "object") return false;
  let testNames = blockedTests;
  let callbacks = blockedCallbacks;
  if (
    ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(node.type)
  ) {
    const local = collectShadowedJestNames(node, names, callbackNames);
    testNames = new Set([...blockedTests, ...local.tests]);
    callbacks = new Set([...blockedCallbacks, ...local.callbacks]);
  }
  if (
    node.type === "CallExpression" &&
    isTestCall(node, names, callbackNames, testNames, callbacks)
  )
    return true;
  return Object.values(node).some((item) =>
    containsTestCall(item, names, callbackNames, testNames, callbacks),
  );
}

function isTestCall(call, names, callbackNames, blockedTests, blockedCallbacks) {
  if (!isCallback(call.arguments[1], callbackNames, blockedCallbacks)) return false;
  const active = {
    callbacks: new Set([...names.callbacks].filter((name) => !blockedTests.has(name))),
    namespaces: new Set([...names.namespaces].filter((name) => !blockedTests.has(name))),
  };
  return isActiveJestTestExpression(call.callee, active);
}

function isCallback(node, callbackNames, blockedCallbacks) {
  if (node?.type === "ArrowFunctionExpression" || node?.type === "FunctionExpression") return true;
  return (
    node?.type === "Identifier" && callbackNames.has(node.name) && !blockedCallbacks.has(node.name)
  );
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
