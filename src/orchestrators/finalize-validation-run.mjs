import { rm } from "node:fs/promises";

export async function finalizeValidationRun({
  result,
  planFailure,
  context,
  removeCoverage = rm,
}) {
  let cleanupFailure;
  if (context.jestCoverageDirectory) {
    const coverageDirectory = context.jestCoverageDirectory;
    try {
      await removeCoverage(coverageDirectory, { recursive: true, force: true });
      context.jestCoverageDirectory = undefined;
    } catch (error) {
      cleanupFailure = { error };
    }
  }

  if (planFailure) {
    if (!cleanupFailure) throw planFailure.error;
    const message = errorMessage(planFailure.error);
    throw new Error(`${message}\nCould not remove run-scoped coverage artifacts: ${errorMessage(cleanupFailure.error)}`, {
      cause: planFailure.error,
    });
  }
  if (!cleanupFailure) return result;

  const diagnostic = `Could not remove run-scoped coverage artifacts: ${errorMessage(cleanupFailure.error)}`;
  if (!Array.isArray(result)) throw new Error(diagnostic);
  const coverageRuleIds = ["E-0.1.130.14", "E-0.1.40.16"];
  const coverageFailure = result.find((entry) => coverageRuleIds.includes(entry.ruleId));
  if (coverageFailure) {
    return result.map((entry) => entry === coverageFailure
      ? { ...entry, message: `${entry.message}\n${diagnostic}` }
      : entry);
  }
  const coverageRuleId = context.packageJson?.eliware?.apply?.includes("library")
    ? "E-0.1.40.16"
    : "E-0.1.130.14";
  return [...result, { ruleId: coverageRuleId, status: "fail", message: diagnostic }];
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
