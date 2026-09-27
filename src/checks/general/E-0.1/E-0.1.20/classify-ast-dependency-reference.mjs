import { classifyStaticAstDependencyReference } from "./classify-static-ast-dependency-reference.mjs";
import { classifyRuntimeAstDependencyReference } from "./classify-runtime-ast-dependency-reference.mjs";

export function classifyAstDependencyReference(
  node,
  declared,
  referenced,
  uncertain,
  requireShadowed,
) {
  classifyStaticAstDependencyReference(node, declared, referenced, requireShadowed);
  classifyRuntimeAstDependencyReference(node, declared, referenced, uncertain, requireShadowed);
}
