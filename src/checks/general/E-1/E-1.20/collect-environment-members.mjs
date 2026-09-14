import { isProcessEnv, propertyName } from "./environment-reference-syntax.mjs";

function addVariable(variables, name) {
  if (/^[A-Z][A-Z0-9_]*$/.test(name)) variables.add(name);
}

export function collectEnvironmentMember(node, aliases, variables) {
  if (node?.type !== "MemberExpression") return;
  const source = isProcessEnv(node.object) || (node.object.type === "Identifier" && aliases.has(node.object.name));
  if (!source) return;
  const name = propertyName(node.property);
  if (name) addVariable(variables, name);
}
