import { executeConventionCheck } from "./check.mjs";

export async function executeConventionRules(selected, context, exemptions) {
  const results = [];
  for (const check of selected) {
    const paths = exemptions instanceof Set ? [] : (exemptions.get(check.ruleId) ?? []);
    results.push(await executeConventionCheck(check, context, paths));
  }
  return results;
}
