import { createRequire } from "node:module";
import { dirname, join } from "node:path";

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

export function resolveJestCli(root, options = {}) {
  return options?.jestCli ?? resolveConsumerJestCli(root);
}
