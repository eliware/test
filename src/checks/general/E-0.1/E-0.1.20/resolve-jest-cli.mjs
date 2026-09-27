import { createRequire } from "node:module";
import { join } from "node:path";
import { resolveJestBin } from "./resolve-jest-bin.mjs";

export function resolveConsumerJestCli(root) {
  const requireFromConsumer = createRequire(join(root, "package.json"));
  const executable =
    resolveJestBin(requireFromConsumer, "jest") ?? resolveJestBin(requireFromConsumer, "jest-cli");
  if (executable) return executable;
  throw new Error("Consumer repository Jest executable could not be resolved.");
}

export function resolveJestCli(root, options = {}) {
  if (options?.jestCli) return options.jestCli;
  try {
    return resolveConsumerJestCli(root);
  } catch (consumerError) {
    const bundled = options?.resolveBundledJestCli
      ? options.resolveBundledJestCli()
      : resolveHarnessJestCli();
    if (bundled) return bundled;
    throw consumerError;
  }
}

export function resolveHarnessJestCli(
  resolveBin = resolveJestBin,
  requireFromHarness = createRequire(import.meta.url),
) {
  return resolveBin(requireFromHarness, "jest") ?? resolveBin(requireFromHarness, "jest-cli");
}
