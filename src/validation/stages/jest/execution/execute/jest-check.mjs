import { join } from "node:path";
import { runJest } from "../run/jest.mjs";
import { runChild } from "../../../../shared/process/run/child.mjs";
import { createJestCheckOptions } from "../../configuration/create-jest/check-options.mjs";
import { sanitizeJestLog } from "../../progress/sanitize-jest-log.mjs";

export async function executeJestCheck(context) {
  let startedAt;
  let timeoutDiagnostic;
  try {
    const options = createJestCheckOptions(context, (message) => {
      timeoutDiagnostic = message;
    });
    options.onStart = () => {
      context.writeCliOutput?.("Logging to ./coverage/jest.log...");
      startedAt = Date.now();
    };
    const result = await runJest(context.root, context.jestArgs ?? [], runChild, options);
    if (startedAt === undefined)
      throw new Error("Jest did not start before the results were returned.");
    if (!(result.timedOut && result.terminationConfirmed === false))
      await sanitizeJestLog(join(context.root, "coverage", "jest.log"), context.sanitizeLogFs);
    return { result: { ...result, startedAt }, timeoutDiagnostic };
  } catch (error) {
    return { error };
  }
}
