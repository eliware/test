import { fail, pass } from "../check-result.mjs";
import { validateLibraryLayout } from "./E-0.1.3.1.2/validate-library-layout.mjs";

export const ruleId = "E-0.1.3.1.2";

export async function run(context = {}) {
  const errors = await validateLibraryLayout(context);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
