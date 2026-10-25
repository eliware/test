import { prepareJestRun } from "../prepare-jest-run.mjs";
import { resolveJestCli } from "../../configuration/resolve/jest/cli.mjs";
import { attachJestConsoleOutput } from "../../progress/attach-jest-console-output.mjs";
import { createJestConsoleOutputLog } from "../../progress/create/jest/console/output-log.mjs";
import { runJestWithConsoleLog } from "../../progress/create/jest/console/run-log.mjs";

export async function runJest(root, args, execute, options) {
  args ??= [];
  const prepared = await prepareJestRun(
    root,
    args,
    (consumerRoot) => resolveJestCli(consumerRoot),
    options,
  );
  options?.onStart?.();
  const outputLog = createJestConsoleOutputLog(prepared.jestLogFile, options?.consoleLogFs);
  let result = await runJestWithConsoleLog(
    prepared,
    execute,
    outputLog,
    options?.env ?? process.env,
  );
  if (result.code === 0)
    result = await attachJestConsoleOutput(prepared, result, options?.readConsoleReport);
  return {
    ...result,
    coverageDirectory: prepared.coverageDirectory,
  };
}
