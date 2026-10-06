import { fail, pass } from "../../orchestration/check-result.mjs";
import { validateGitHygiene } from "./E-0.1.0.1.8/validate-git-hygiene.mjs";

export const ruleId = "E-0.1.0.1.8";

export async function run(context = {}) {
  const errors = await validateGitHygiene(context.root ?? process.cwd(), context.runGit);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
