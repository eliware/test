import { prepareJestRun } from "./prepare-jest-run.mjs";
import { resolveJestCli } from "./resolve-jest-cli.mjs";
import { rm } from "node:fs/promises";
import { executePreparedJestRun } from "./execute-prepared-jest-run.mjs";
import {
  cleanupAfterPreparedJestFailure,
  finalizePreparedJestRun,
} from "./finalize-prepared-jest-run.mjs";
import { attachJestConsoleOutput } from "./attach-jest-console-output.mjs";

export async function runJest(root, args, execute, options, removeCoverage = rm) {
  args ??= [];
  const prepared = await prepareJestRun(
    root,
    args,
    (consumerRoot) => resolveJestCli(consumerRoot),
    options,
  );
  options?.onStart?.();
  let result;
  try {
    result = await executePreparedJestRun(prepared, execute);
  } catch (error) {
    // codescope ignore: cleanup failure is appended before rejection, and the coverage check retries cleanup for unavailable results
    return cleanupAfterPreparedJestFailure(prepared, error, removeCoverage);
  }
  if (result.code === 0)
    result = await attachJestConsoleOutput(prepared, result, options?.readConsoleReport);
  // codescope ignore: unavailable report results retain run-scoped coverage for the dependent coverage check to diagnose and clean.
  return finalizePreparedJestRun(
    prepared,
    result,
    options?.retainCoverageDirectory,
    removeCoverage,
  );
}
