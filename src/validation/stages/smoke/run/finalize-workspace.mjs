import finishSmokeRun from "../finish-smoke-run.mjs";
import formatSmokeFinalizationFailure from "./format-smoke/finalization-failure.mjs";
import formatSmokeOutcome from "./format-smoke/outcome.mjs";
export default async function finalizeNpmConsumerSmokeWorkspace({
  packageJson,
  workspace,
  context,
  executeTransaction,
  restoreState,
  outcomeFormatter = formatSmokeOutcome,
  finish = finishSmokeRun,
  formatFailure = formatSmokeFinalizationFailure,
}) {
  const { targetRoot, assertTargetIdentity } = context;
  const { tempRoot, tempIdentity, state } = workspace;
  let outcome;
  try {
    outcome = await outcomeFormatter(packageJson, async () => {
      if (workspace.error) throw workspace.error;
      return executeTransaction();
    });
  } finally {
    try {
      outcome = await finish({
        outcome,
        state,
        targetRoot,
        assertTargetIdentity,
        restoreState,
        tempRoot,
        tempIdentity,
      });
    } catch (error) {
      outcome = formatFailure(outcome, error, tempRoot);
    }
  }
  return outcome;
}
