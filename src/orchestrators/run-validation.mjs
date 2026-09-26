import { executeValidationPlan } from "./execute-validation-plan.mjs";
import { selectConventionChecks } from "./select-convention-checks.mjs";
import { loadValidationTarget } from "./load-validation-target.mjs";
import { prepareValidationExemptions } from "./prepare-validation-exemptions.mjs";
import { discoverAllChecks } from "./discover-checks.mjs";
import { validateBundledDirectiveCompleteness } from "./validate-bundled-directive-completeness.mjs";
import { prepareValidationPlan } from "./prepare-validation-plan.mjs";
import { findRepositoryEntries } from "../checks/general/E-0.1/find-repository-files.mjs";
import { rm } from "node:fs/promises";

export const validationDependencies = Object.freeze({
  loadValidationTarget,
  selectConventionChecks,
  discoverAllChecks,
  validateBundledDirectiveCompleteness,
  prepareValidationExemptions,
  executeValidationPlan,
  findRepositoryEntries,
});

export function resolveValidationDependencies(dependencies = validationDependencies) {
  return dependencies;
}

export async function runValidation(root, ignoredRuleIds, options = {}) {
  const dependencies = resolveValidationDependencies(options.dependencies);
  const {
    loadValidationTarget: loadTarget,
    selectConventionChecks: selectChecks,
    discoverAllChecks: discoverChecks,
    validateBundledDirectiveCompleteness: validateCompleteness,
    prepareValidationExemptions: prepareExemptions,
    findRepositoryEntries: findFiles,
    executeValidationPlan: executePlan,
  } = dependencies;
  const plan = await prepareValidationPlan(root, ignoredRuleIds, options, {
    loadValidationTarget: loadTarget,
    selectConventionChecks: selectChecks,
    discoverAllChecks: discoverChecks,
    validateBundledDirectiveCompleteness: validateCompleteness,
    prepareValidationExemptions: prepareExemptions,
    findRepositoryEntries: findFiles,
  });
  let result;
  let planError;
  try {
    result = await executePlan(plan.checks, plan.context, plan.exemptions);
  } catch (error) {
    planError = error;
  }
  let cleanupError;
  if (plan.context.jestCoverageDirectory) {
    const coverageDirectory = plan.context.jestCoverageDirectory;
    try {
      await (options.removeCoverage ?? rm)(coverageDirectory, { recursive: true, force: true });
      plan.context.jestCoverageDirectory = undefined;
    } catch (error) {
      cleanupError = error;
    }
  }
  if (planError) {
    if (!cleanupError) throw planError;
    const message = planError instanceof Error ? planError.message : String(planError);
    throw new Error(`${message}\nCould not remove run-scoped coverage artifacts: ${cleanupError.message}`, {
      cause: planError,
    });
  }
  if (cleanupError) {
    const diagnostic = `Could not remove run-scoped coverage artifacts: ${cleanupError.message}`;
    if (Array.isArray(result)) {
      const coverageFailure = result.find((entry) => entry.ruleId === "E-0.1.130.14");
      if (coverageFailure) {
        return result.map((entry) => entry === coverageFailure
          ? { ...entry, message: `${entry.message}\n${diagnostic}` }
          : entry);
      }
      return [...result, { ruleId: "E-0.1.130.14", status: "fail", message: diagnostic }];
    }
    throw new Error(diagnostic);
  }
  return result;
}
