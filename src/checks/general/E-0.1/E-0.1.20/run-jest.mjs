import { prepareJestRun } from "./prepare-jest-run.mjs";
import { resolveJestCli } from "./resolve-jest-cli.mjs";
import { rm } from "node:fs/promises";

export async function runJest(root, args, execute, options, removeCoverage = rm) {
  args ??= [];
  const prepared = await prepareJestRun(
    root,
    args,
    (consumerRoot, prepareOptions) => resolveJestCli(consumerRoot, prepareOptions),
    options,
  );
  try {
    const result = await execute(prepared.command, prepared.args, prepared.options);
    if (result.code !== 0 || result.timedOut) {
      try {
        await removeCoverage(prepared.coverageDirectory, { recursive: true, force: true });
        return { ...result, coverageDirectory: undefined };
      } catch (error) {
        return {
          ...result,
          coverageDirectory: prepared.coverageDirectory,
          cleanupError: `Could not remove run-scoped coverage artifacts: ${error.message}`,
        };
      }
    }
    if (options?.retainCoverageDirectory)
      return { ...result, coverageDirectory: prepared.coverageDirectory };
    try {
      await removeCoverage(prepared.coverageDirectory, { recursive: true, force: true });
      return { ...result, coverageDirectory: undefined };
    } catch (error) {
      return {
        ...result,
        coverageDirectory: prepared.coverageDirectory,
        cleanupError: `Could not remove run-scoped coverage artifacts: ${error.message}`,
      };
    }
  } catch (error) {
    try {
      await removeCoverage(prepared.coverageDirectory, { recursive: true, force: true });
    } catch (cleanupError) {
      const message = error instanceof Error ? error.message : String(error);
      const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
      throw new Error(
        `${message}\nCould not remove run-scoped coverage artifacts: ${cleanupMessage}`,
        { cause: error },
      );
    }
    throw error;
  }
}
