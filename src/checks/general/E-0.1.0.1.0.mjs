import { fail, pass } from "../check-result.mjs";
import { validateEliwareMetadata } from "./E-0.1.0.1.0/validate/eliware/metadata.mjs";
import { validateProfileDocumentPairs } from "./E-0.1.0.1.0/validate/profile-document-pairs.mjs";
import { validateRepositoryMap } from "./E-0.1.0.1.0/validate/repository-map.mjs";

export const ruleId = "E-0.1.0.1.0";

export async function run(context = {}) {
  const failures = [...validateEliwareMetadata(context.packageJson)];
  const root = context.root ?? process.cwd();
  failures.push(...(await validateProfileDocumentPairs()));
  failures.push(...(await validateRepositoryMap(root, context.packageJson)));
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
