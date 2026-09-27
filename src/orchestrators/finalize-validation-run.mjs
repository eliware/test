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
  const coverageFailure = result.find((entry) => entry.ruleId === "E-0.1.130.14");
  if (coverageFailure) {
    return result.map((entry) => entry === coverageFailure
      ? { ...entry, message: `${entry.message}\n${diagnostic}` }
      : entry);
  }
  return [...result, { ruleId: "E-0.1.130.14", status: "fail", message: diagnostic }];
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
