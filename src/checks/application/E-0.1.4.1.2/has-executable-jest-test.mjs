import { parse } from "@babel/parser";
import { collectJestTestNames, isActiveTestExpression } from "./collect-jest-test-names.mjs";
import { referencesTestSource } from "./references-test-source.mjs";

export function inspectJestTestModule(content, testPath, sourcePath) {
  let ast;
  try {
    ast = parse(content, { sourceType: "module" });
  } catch {
    return { hasExecutableTest: false, importsSource: false };
  }
  const testNames = collectJestTestNames(ast.program);
  const callbackNames = findCallbackNames(ast.program);
  return {
    hasExecutableTest: containsTestCall(ast.program, testNames, callbackNames),
    importsSource: referencesTestSource(ast.program, testPath, sourcePath),
  };
}

function containsTestCall(node, names, callbackNames) {
  if (Array.isArray(node)) return node.some((item) => containsTestCall(item, names, callbackNames));
  if (!node || typeof node !== "object") return false;
  if (node.type === "CallExpression" && isTestCall(node, names, callbackNames)) return true;
  return Object.values(node).some((item) => containsTestCall(item, names, callbackNames));
}

function isTestCall(call, names, callbackNames) {
  if (!isCallback(call.arguments[1], callbackNames)) return false;
  return isActiveTestExpression(call.callee, names);
}

function isCallback(node, callbackNames) {
  if (node?.type === "ArrowFunctionExpression" || node?.type === "FunctionExpression") return true;
  return node?.type === "Identifier" && callbackNames.has(node.name);
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
