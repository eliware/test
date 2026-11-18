import isActiveJestTestExpression from "./active-jest-test-expression.mjs";
export default function isRegisteredJestTestCall(
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
