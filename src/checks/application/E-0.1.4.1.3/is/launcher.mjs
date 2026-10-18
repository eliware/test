export function isLauncher(callee, names) {
  const property = callee?.computed ? callee.property?.value : callee?.property?.name;
  return (
    (callee?.type === "Identifier" && names.has(callee.name)) ||
    (callee?.type === "MemberExpression" && names.has(property))
  );
}
