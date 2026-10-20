import { fail, pass } from "../check-result.mjs";
import { validateReleaseNotes } from "./E-0.1.0.1.13/validate/release-notes.mjs";

export const ruleId = "E-0.1.0.1.13";

export async function run(context = {}, dependencies = {}) {
  const errors = await validateReleaseNotes(context, dependencies);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
