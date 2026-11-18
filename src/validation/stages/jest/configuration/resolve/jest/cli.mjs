import { createRequire } from "node:module";
import { join } from "node:path";
import resolveJestBin from "./bin.mjs";
export default function resolveConsumerJestCli(root) {
  const requireFromConsumer = createRequire(join(root, "package.json"));
  const executable =
    resolveJestBin(requireFromConsumer, "jest") ?? resolveJestBin(requireFromConsumer, "jest-cli");
  if (executable) return executable;
  return undefined;
}
