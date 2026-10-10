import { isActiveJestTestExpression } from "./is-active-jest-test-expression.mjs";

export function isRegisteredJestTestCall(
  call,
  names,
  callbackNames,
  blockedTests,
  blockedCallbacks,
) {
  if (!isCallback(call.arguments[1], callbackNames, blockedCallbacks)) return false;
  const active = {
    callbacks: new Set([...names.callbacks].filter((name) => !blockedTests.has(name))),
    namespaces: new Set([...names.namespaces].filter((name) => !blockedTests.has(name))),
  };
  return isActiveJestTestExpression(call.callee, active);
}

export function isRegisteredJestSuiteCall(call, describeNames, blockedDescribes, callbackNames) {
  const callback = call.arguments[1];
  const callee = call.callee;
  const suiteName =
    callee.type === "Identifier"
      ? callee.name
      : callee.type === "MemberExpression" &&
          (callee.computed ? callee.property.value : callee.property.name) === "only"
        ? callee.object?.name
        : null;
  return (
    (isFunction(callback) ||
      (callback?.type === "Identifier" && callbackNames.has(callback.name))) &&
    describeNames.has(suiteName) &&
    !blockedDescribes.has(suiteName)
  );
}

export function isSkippedJestSuiteCall(call, describeNames) {
  const callee = call.callee;
  if (callee?.type !== "MemberExpression") return false;
  const property = callee.computed ? callee.property.value : callee.property.name;
  return property === "skip" && describeNames.has(callee.object?.name);
}

function isCallback(node, callbackNames, blockedCallbacks) {
  return (
    isFunction(node) ||
    (node?.type === "Identifier" &&
      callbackNames.has(node.name) &&
      !blockedCallbacks.has(node.name))
  );
}

function isFunction(node) {
  return ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(
    node?.type,
  );
}
