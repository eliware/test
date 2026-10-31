import { executeConventionCheck } from "./check.mjs";

export async function executeConventionRules(selected, context, exemptions) {
  return Promise.all(
    selected.map((check) => {
      const paths = exemptions instanceof Set ? [] : (exemptions.get(check.ruleId) ?? []);
      return executeConventionCheck(check, context, paths);
    }),
  );
}
