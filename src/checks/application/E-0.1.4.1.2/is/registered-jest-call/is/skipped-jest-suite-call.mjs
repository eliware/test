function isSkippedJestSuiteCall(call, describeNames) {
  const callee = call.callee;
  if (callee?.type !== "MemberExpression") return false;
  const property = callee.computed ? callee.property.value : callee.property.name;
  return property === "skip" && describeNames.has(callee.object?.name);
}
export default isSkippedJestSuiteCall;
