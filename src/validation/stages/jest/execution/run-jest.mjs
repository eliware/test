import { prepareJestRun } from "./prepare-jest-run.mjs";
import { resolveJestCli } from "../configuration/resolve-jest-cli.mjs";
import { executePreparedJestRun } from "./execute-prepared-jest-run.mjs";
import { attachJestConsoleOutput } from "../progress/attach-jest-console-output.mjs";

export async function runJest(root, args, execute, options) {
  args ??= [];
  const prepared = await prepareJestRun(
    root,
    args,
    (consumerRoot) => resolveJestCli(consumerRoot),
    options,
  );
  options?.onStart?.();
  let result = await executePreparedJestRun(prepared, execute);
  if (result.code === 0)
    result = await attachJestConsoleOutput(prepared, result, options?.readConsoleReport);
  return {
    ...result,
    coverageDirectory: prepared.coverageDirectory,
  };
}
