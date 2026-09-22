import { collectEnvironmentReferences } from "./environment-ast-analysis.mjs";
import { propertyName } from "./environment-reference-syntax.mjs";
import { discoverEnvironmentReferences } from "./discover-environment-references.mjs";

export { propertyName };
export function collect(node, aliases, variables) {
  return collectEnvironmentReferences(node, aliases, variables);
}
export function findEnvironmentReferences(root, repositoryFiles) {
  return discoverEnvironmentReferences(root, repositoryFiles);
}
