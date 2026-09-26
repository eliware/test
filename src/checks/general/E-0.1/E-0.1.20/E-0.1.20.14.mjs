import { fail, pass } from "../../../check-result.mjs";
import { findDependencyReferences } from "./find-dependency-references.mjs";

export const ruleId = "E-0.1.20.14";
export const parentRuleId = "E-0.1.20";

export async function run({ root, packageJson, referencedDependencies, repositoryFiles, repositoryInventory, parseAst }) {
  const declared = [
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
    ...Object.keys(packageJson?.optionalDependencies ?? {}),
    ...Object.keys(packageJson?.peerDependencies ?? {}),
  ];
  if (declared.length === 0) return pass(ruleId);
  let referenced;
  try {
    if (referencedDependencies) referenced = referencedDependencies;
    else {
      const files = repositoryFiles ?? (repositoryInventory ? await repositoryInventory.repositoryFiles() : null);
      referenced = await findDependencyReferences(
        root,
        packageJson,
        files,
        parseAst,
        repositoryInventory,
      );
    }
  } catch (error) {
    return fail(ruleId, `Dependency usage could not be inspected: ${error.message}`);
  }
  if (referenced.uncertain)
    return fail(ruleId, "Dependency usage is dynamically constructed and cannot be proven unused or used.");
  const unused = declared.filter((name) => !referenced.includes(name));
  if (unused.length > 0) return fail(ruleId, `Unused direct dependencies: ${unused.join(", ")}.`);
  return pass(ruleId);
}
