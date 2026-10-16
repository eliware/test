import { prepareJestRun } from "../prepare-jest-run.mjs";
import { resolveJestCli } from "../../configuration/resolve/jest/cli.mjs";
import { executePreparedJestRun } from "../execute/prepared-jest-run.mjs";
import { attachJestConsoleOutput } from "../../progress/attach-jest-console-output.mjs";
import { createJestConsoleOutputLog } from "../../progress/create/jest/console/output-log.mjs";
import { collectRedactionSecrets } from "../../../../shared/output/redaction/collect-redaction-secrets.mjs";

export async function runJest(root, args, execute, options) {
  args ??= [];
  const prepared = await prepareJestRun(
    root,
    args,
    (consumerRoot) => resolveJestCli(consumerRoot),
    options,
  );
  options?.onStart?.();
  const outputLog = createJestConsoleOutputLog(prepared.consoleOutputFile, options?.consoleLogFs);
  outputLog.start();
  let result;
  try {
    result = await executePreparedJestRun(
      {
        ...prepared,
        options: {
          ...prepared.options,
          onRawStdout: (chunk) => outputLog.append("stdout", chunk),
          onRawStderr: (chunk) => outputLog.append("stderr", chunk),
        },
      },
      execute,
    );
  } catch (error) {
    outputLog.finish(collectRedactionSecrets(options?.env ?? process.env));
    throw error;
  }
  if (!(result.timedOut && result.terminationConfirmed === false)) {
    const logResult = outputLog.finish(collectRedactionSecrets(options?.env ?? process.env));
    result = {
      ...result,
      ...(logResult.redacted
        ? { outputRedacted: true, outputRedactionKinds: logResult.redactionKinds }
        : {}),
      ...(logResult.writeError ? { outputLogError: true } : {}),
    };
  }
  if (result.code === 0)
    result = await attachJestConsoleOutput(prepared, result, options?.readConsoleReport);
  return {
    ...result,
    coverageDirectory: prepared.coverageDirectory,
  };
}
