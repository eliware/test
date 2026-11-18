import { createRequire } from "node:module";
import { join } from "node:path";
import resolveJestBin from "../../bin.mjs";
import selectJestCli from "../../../../select-jest-cli.mjs";
import resolveSharedJestCli from "./shared-jest-cli.mjs";
function resolveConsumerJestCli(root) {
  const requireFromConsumer = createRequire(join(root, "package.json"));
  const executable =
    resolveJestBin(requireFromConsumer, "jest") ?? resolveJestBin(requireFromConsumer, "jest-cli");
  if (executable) return executable;
  return undefined;
}
function resolveJestCli(root) {
  return selectJestCli(() => resolveConsumerJestCli(root), resolveSharedJestCli);
}
export default resolveJestCli;
