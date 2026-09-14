import { fail, pass } from "../../../check-result.mjs";
import { readWorkflows } from "./read-workflow-files.mjs";

export const ruleId = "E-1.24.3";
export const parentRuleId = "E-1.24";

export async function run({ root }) {
  for (const { name, document } of await readWorkflows(root)) {
    const concurrency = document?.concurrency;
    const group = concurrency?.group;
    const identifiesRepository = typeof group === "string" && /\bgithub\.repository\b/iu.test(group);
    const identifiesRef = typeof group === "string" && /\bgithub\.(?:ref|ref_name|head_ref)\b/iu.test(group);
    if (
      !concurrency ||
      typeof concurrency !== "object" ||
      typeof concurrency.group !== "string" ||
      !identifiesRepository ||
      !identifiesRef ||
      concurrency["cancel-in-progress"] !== true
    ) {
      return fail(ruleId, `${name} must cancel obsolete runs for each repository and ref.`);
    }
  }
  return pass(ruleId);
}
