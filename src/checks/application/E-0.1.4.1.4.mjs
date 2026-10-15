import { fail, pass } from "../check-result.mjs";
import { validateApplicationReleaseNotes } from "./E-0.1.4.1.4/validate/application-release-notes.mjs";

export const ruleId = "E-0.1.4.1.4";

export async function run(context = {}, dependencies = {}) {
  const errors = await validateApplicationReleaseNotes(context, dependencies);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
