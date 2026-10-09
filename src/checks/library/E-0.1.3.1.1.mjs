import { fail, pass } from "../check-result.mjs";
import { validateLibraryEntrypoints } from "./E-0.1.3.1.1/validate-library-entrypoints.mjs";
import { validateLibraryTypecheck } from "./E-0.1.3.1.1/validate-library-typecheck.mjs";

export const ruleId = "E-0.1.3.1.1";

export async function run(context = {}, dependencies = {}) {
  const errors = await validateLibraryEntrypoints(context, dependencies);
  errors.push(...validateLibraryTypecheck(context.packageJson));
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
