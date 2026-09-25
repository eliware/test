import { isProcessEnv, propertyName } from "./environment-reference-syntax.mjs";

function addVariable(variables, name) {
  if (/^[A-Z][A-Z0-9_]*$/.test(name)) variables.add(name);
}

export function collectEnvironmentBindings(node, aliases, variables) {
  if (node?.type !== "VariableDeclarator") return;
  if (node.id.type === "Identifier" && isProcessEnv(node.init)) aliases.add(node.id.name);
  if (node.id.type === "ObjectPattern" && isProcessEnv(node.init)) {
    for (const property of node.id.properties) {
      if (property.type === "ObjectProperty") {
        const name = propertyName(property.key, property.computed);
        if (name) addVariable(variables, name);
      }
    }
  }
}
