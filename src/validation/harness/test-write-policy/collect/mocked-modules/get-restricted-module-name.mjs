function getRestrictedModuleName(init) {
  if (init?.type === "ImportExpression") return init.source.value;
  if (init?.type === "CallExpression" && init.callee?.name === "require")
    return init.arguments[0]?.value;
  return undefined;
}
export default getRestrictedModuleName;
