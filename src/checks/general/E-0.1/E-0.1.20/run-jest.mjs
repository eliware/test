import { prepareJestRun } from "./prepare-jest-run.mjs";
import { resolveJestCli } from "./resolve-jest-cli.mjs";
import { rm } from "node:fs/promises";

export async function runJest(root, args, execute, options) {
  args ??= [];
  const prepared = await prepareJestRun(
    root,
    args,
    (consumerRoot, prepareOptions) => resolveJestCli(consumerRoot, prepareOptions),
    options,
  );
  try {
    const result = await execute(prepared.command, prepared.args, prepared.options);
    return { ...result, coverageDirectory: prepared.coverageDirectory };
  } catch (error) {
    await rm(prepared.coverageDirectory, { recursive: true, force: true });
    throw error;
  }
}
