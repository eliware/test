import { join } from "node:path";
import { runJest } from "../run/jest.mjs";
import { runChild } from "../../../../shared/process/run/child.mjs";
import { createJestCheckOptions } from "../../configuration/create-jest/check-options.mjs";
import { sanitizeJestLog } from "../../progress/sanitize-jest-log.mjs";
import { focusedPathsFrom } from "../../../../../cli/parse/focused-arguments.mjs";
import { findIgnoredRepositoryPaths } from "../../../../shared/repository/find-repository-files.mjs";
import { isIgnoredRepositoryPath } from "../../../../shared/repository/repository-inventory/path-filters.mjs";

export async function executeJestCheck(context) {
  let startedAt;
  let timeoutDiagnostic;
  try {
    const args = context.jestArgs ?? [];
    const focusedPaths = focusedPathsFrom(args);
    let jestArgs = args;
    if (focusedPaths.length > 0) {
      const ignoredPaths = await findIgnoredRepositoryPaths(context.root);
      const retainedPaths = focusedPaths.filter(
        (path) => !isIgnoredRepositoryPath(path, ignoredPaths),
      );
      if (retainedPaths.length === 0)
        return { skipped: true, result: { code: 0, stdout: "", stderr: "" } };
      const retained = new Set(retainedPaths);
      const focused = new Set(focusedPaths);
      jestArgs = args.filter((argument) => !focused.has(argument) || retained.has(argument));
    }
    const options = createJestCheckOptions(context, (message) => {
      timeoutDiagnostic = message;
    });
    options.onStart = () => {
      context.writeCliOutput?.("Logging to ./coverage/jest.log...");
      startedAt = Date.now();
    };
    const result = await runJest(context.root, jestArgs, runChild, options);
    if (startedAt === undefined)
      throw new Error("Jest did not start before the results were returned.");
    if (!(result.timedOut && result.terminationConfirmed === false))
      await sanitizeJestLog(join(context.root, "coverage", "jest.log"), context.sanitizeLogFs);
    return { result: { ...result, startedAt }, timeoutDiagnostic };
  } catch (error) {
    return { error };
  }
}
