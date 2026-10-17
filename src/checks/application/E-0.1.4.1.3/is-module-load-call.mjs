export function isModuleLoadCall(node) {
  const callee = node.callee;
  return (
    node.type === "CallExpression" &&
    (callee?.type === "Import" ||
      (callee?.type === "Identifier" && ["require", "load"].includes(callee.name)) ||
      (callee?.type === "MemberExpression" &&
        callee.object?.name === "module" &&
        ["require"].includes(callee.property?.name ?? callee.property?.value)))
  );
}
