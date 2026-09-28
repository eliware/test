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
  if (options?.jestCli !== undefined) {
    if (typeof options.jestCli !== "string" || options.jestCli.trim().length === 0) {
      throw new Error("Injected Jest CLI must be a nonempty string.");
    }
    return options.jestCli;
  }
  try {
    return resolveConsumerJestCli(root);
  } catch (consumerError) {
    const bundled = options?.resolveBundledJestCli
      ? options.resolveBundledJestCli()
      : resolveSharedJestCli();
    if (bundled) return bundled;
    throw consumerError;
  }
}

export function resolveSharedJestCli(
  resolveBin = resolveJestBin,
  requireFromHarness = createRequire(import.meta.url),
) {
  return resolveBin(requireFromHarness, "jest") ?? resolveBin(requireFromHarness, "jest-cli");
}
