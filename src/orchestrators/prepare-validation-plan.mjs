import { readConventionConfig } from "./read-convention-config.mjs";
import { createValidationContext } from "./create-validation-context.mjs";

export async function prepareValidationPlan(root, ignoredRuleIds, options, dependencies) {
  const packageJson = await dependencies.loadValidationTarget(root);
  const conventions = readConventionConfig(packageJson);
  const allChecks = await dependencies.discoverAllChecks();
  const checks = await dependencies.selectConventionChecks(conventions, allChecks);
  const focused = (options.jestArgs ?? []).some((argument) =>
    /^tests?[\\/].+\.(?:test|spec)\.[cm]?[jt]sx?$/iu.test(argument));
  // codescope ignore: focused CLI execution intentionally narrows runtime checks while completeness remains full-plan.
  const executionChecks = focused ? checks.filter(({ ruleId }) => ruleId === "E-1.20") : checks;
  await dependencies.validateBundledDirectiveCompleteness(allChecks, conventions.apply);
  const exemptions = dependencies.prepareValidationExemptions(packageJson, allChecks, ignoredRuleIds);
  return {
    checks: executionChecks,
    context: createValidationContext(root, packageJson, options),
    exemptions,
  };
}
