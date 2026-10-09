import { isActiveJestTestExpression } from "./is-active-jest-test-expression.mjs";
import { collectShadowedJestNames } from "./collect-shadowed-jest-names.mjs";
import { collectJestDescribeNames } from "./collect-jest-describe-names.mjs";

export function hasRegisteredJestTest(program, bindings) {
  const { names, callbackNames, blockedTests, blockedCallbacks } = bindings;
  const describeNames = collectJestDescribeNames(program);
  return containsTestCall(
    program,
    names,
    callbackNames,
    blockedTests,
    blockedCallbacks,
    describeNames,
  );
}

function containsTestCall(
  node,
  names,
  callbackNames,
  blockedTests,
  blockedCallbacks,
  describeNames,
  allowFunction = false,
) {
  if (Array.isArray(node))
    return node.some((item) =>
      containsTestCall(item, names, callbackNames, blockedTests, blockedCallbacks, describeNames),
    );
  if (!node || typeof node !== "object") return false;
  if (isFunction(node)) {
    if (!allowFunction) return false;
    const local = collectShadowedJestNames(node, names, callbackNames);
    return containsTestCall(
      node.body,
      names,
      callbackNames,
      new Set([...blockedTests, ...local.tests]),
      new Set([...blockedCallbacks, ...local.callbacks]),
      describeNames,
    );
  }
  if (node.type === "CallExpression") {
    if (isTestCall(node, names, callbackNames, blockedTests, blockedCallbacks)) return true;
    if (isDescribeCall(node, describeNames, callbackNames)) {
      const callback = node.arguments[1];
      return containsTestCall(
        callback,
        names,
        callbackNames,
        blockedTests,
        blockedCallbacks,
        describeNames,
        true,
      );
    }
  }
  return Object.values(node).some((item) =>
    containsTestCall(item, names, callbackNames, blockedTests, blockedCallbacks, describeNames),
  );
}

function isFunction(node) {
  return ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(
    node?.type,
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
  return (
    isFunction(node) ||
    (node?.type === "Identifier" &&
      callbackNames.has(node.name) &&
      !blockedCallbacks.has(node.name))
  );
}

function isDescribeCall(call, describeNames, callbackNames) {
  const callback = call.arguments[1];
  return (
    (isFunction(callback) ||
      (callback?.type === "Identifier" && callbackNames.has(callback.name))) &&
    call.callee.type === "Identifier" &&
    describeNames.has(call.callee.name)
  );
}
