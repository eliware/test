import { createRequire } from "node:module";
import { join } from "node:path";
import { resolveJestBin } from "./resolve-jest-bin.mjs";
import { selectJestCli } from "./select-jest-cli.mjs";

export function resolveConsumerJestCli(root) {
  const requireFromConsumer = createRequire(join(root, "package.json"));
  const executable =
    resolveJestBin(requireFromConsumer, "jest") ?? resolveJestBin(requireFromConsumer, "jest-cli");
  if (executable) return executable;
  throw new Error("Consumer repository Jest executable could not be resolved.");
}

export function resolveJestCli(root) {
  return selectJestCli(() => resolveConsumerJestCli(root), resolveSharedJestCli);
}

export function resolveSharedJestCli(
  resolveBin = resolveJestBin,
  requireFromHarness = createRequire(import.meta.url),
) {
  return resolveBin(requireFromHarness, "jest") ?? resolveBin(requireFromHarness, "jest-cli");
}
