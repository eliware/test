function isRegisteredJestSuiteCall(call, describeNames, blockedDescribes, callbackNames) {
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
function isFunction(node) {
  return ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(
    node?.type,
  );
}
export default isRegisteredJestSuiteCall;
