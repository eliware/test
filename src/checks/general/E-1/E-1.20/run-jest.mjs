import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { prepareJestRun } from "./prepare-jest-run.mjs";
const runLocks = new Map();
export function resolveConsumerJestCli(root) {
  const requireFromConsumer = createRequire(join(root, "package.json"));
  for (const candidate of ["jest-cli/bin/jest.js", "jest/bin/jest.js"]) {
    try {
      return requireFromConsumer.resolve(candidate);
    } catch {}
  }
  try {
    const packageEntry = requireFromConsumer.resolve("jest-cli");
    return join(dirname(packageEntry), "..", "bin", "jest.js");
  } catch (error) {
    throw new Error(`Consumer repository Jest executable could not be resolved: ${error.message}`, { cause: error });
  }
}

export function resolveJestCli(root, execute, options = {}) {
  return options?.jestCli ?? resolveConsumerJestCli(root);
}

export async function runJest(root, args, execute, options) {
  args ??= [];
  const previous = runLocks.get(root) ?? Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  const queued = previous.then(() => current);
  runLocks.set(root, queued);
  await previous;
  try {
    const prepared = await prepareJestRun(
      root,
      args,
      (consumerRoot, prepareOptions) => resolveJestCli(consumerRoot, execute, prepareOptions),
      options,
    );
    return await execute(prepared.command, prepared.args, prepared.options);
  } finally {
    release();
    if (runLocks.get(root) === queued) runLocks.delete(root);
  }
}
