import { prepareJestRun } from "./prepare-jest-run.mjs";
import { resolveJestCli } from "./resolve-jest-cli.mjs";
import { rm } from "node:fs/promises";
import { executePreparedJestRun } from "./execute-prepared-jest-run.mjs";
import {
  cleanupAfterPreparedJestFailure,
  finalizePreparedJestRun,
} from "./finalize-prepared-jest-run.mjs";

export async function runJest(root, args, execute, options, removeCoverage = rm) {
  args ??= [];
  const prepared = await prepareJestRun(
    root,
    args,
    (consumerRoot, prepareOptions) => resolveJestCli(consumerRoot, prepareOptions),
    options,
  );
  let result;
  try {
    result = await executePreparedJestRun(prepared, execute);
  } catch (error) {
    return cleanupAfterPreparedJestFailure(prepared, error, removeCoverage);
  }
  return finalizePreparedJestRun(
    prepared,
    result,
    options?.retainCoverageDirectory,
    removeCoverage,
  );
}
