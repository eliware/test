import { executePreparedJestRun } from "../../../../execution/execute/prepared-jest-run.mjs";
import { collectRedactionSecrets } from "../../../../../../shared/output/redaction/collect-redaction-secrets.mjs";

export async function runJestWithConsoleLog(prepared, execute, outputLog, env = process.env) {
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
    outputLog.finish(collectRedactionSecrets(env));
    throw error;
  }
  if (!(result.timedOut && result.terminationConfirmed === false)) {
    const logResult = outputLog.finish(collectRedactionSecrets(env));
    result = {
      ...result,
      ...(logResult.redacted
        ? { outputRedacted: true, outputRedactionKinds: logResult.redactionKinds }
        : {}),
      ...(logResult.writeError ? { outputLogError: true } : {}),
    };
  }
  return result;
}
