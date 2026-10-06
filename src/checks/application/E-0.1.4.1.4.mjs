import { fail, pass } from "../../orchestration/check-result.mjs";
import { validateApplicationReleaseNotes } from "./E-0.1.4.1.4/validate-application-release-notes.mjs";

export const ruleId = "E-0.1.4.1.4";
export const enforcementMode = "deterministic";

export async function run(context = {}) {
  const errors = await validateApplicationReleaseNotes(context);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
