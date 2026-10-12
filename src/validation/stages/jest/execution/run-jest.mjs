import { prepareJestRun } from "./prepare-jest-run.mjs";
import { resolveJestCli } from "../configuration/resolve-jest-cli.mjs";
import { rm } from "node:fs/promises";
import { executePreparedJestRun } from "./execute-prepared-jest-run.mjs";
import {
  cleanupAfterPreparedJestFailure,
  finalizePreparedJestRun,
} from "./finalize-prepared-jest-run.mjs";
import { attachJestConsoleOutput } from "../progress/attach-jest-console-output.mjs";

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
    return cleanupAfterPreparedJestFailure(prepared, error, removeCoverage);
  }
  if (result.code === 0)
    result = await attachJestConsoleOutput(prepared, result, options?.readConsoleReport);
  return finalizePreparedJestRun(
    prepared,
    result,
    options?.retainCoverageDirectory,
    removeCoverage,
  );
}
