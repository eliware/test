import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { runChild } from "./run-child.mjs";
import { prepareJestRun } from "./prepare-jest-run.mjs";
export function resolveConsumerJestCli(root) {
  const requireFromConsumer = createRequire(join(root, "package.json"));
  for (const candidate of ["jest-cli/bin/jest.js", "jest/bin/jest.js"]) {
    try {
      return requireFromConsumer.resolve(candidate);
    } catch {}
  }
  const packageEntry = requireFromConsumer.resolve("jest-cli");
  return join(dirname(packageEntry), "..", "bin", "jest.js");
}

export function resolveJestCli(root, execute, options = {}) {
  return options?.jestCli ?? (execute === runChild ? resolveConsumerJestCli(root) : "jest-cli");
}

export async function runJest(root, args, execute, options) {
  args ??= [];
  const prepared = await prepareJestRun(
    root,
    args,
    (consumerRoot, prepareOptions) => resolveJestCli(consumerRoot, execute, prepareOptions),
    options,
  );
  return execute(prepared.command, prepared.args, prepared.options);
}
