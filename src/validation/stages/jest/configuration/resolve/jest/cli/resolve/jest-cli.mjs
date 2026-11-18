import { createRequire } from "node:module";
import { join } from "node:path";
import resolveJestBin from "../../bin.mjs";
import selectJestCli from "../../../../select-jest-cli.mjs";
import resolveSharedJestCli from "./shared-jest-cli.mjs";
function resolveConsumerJestCli(root, resolveBin) {
  const requireFromConsumer = createRequire(join(root, "package.json"));
  const executable =
    resolveBin(requireFromConsumer, "jest") ?? resolveBin(requireFromConsumer, "jest-cli");
  if (executable) return executable;
  return undefined;
}
function resolveJestCli(root, resolveBin = resolveJestBin) {
  return selectJestCli(
    () => resolveConsumerJestCli(root, resolveBin),
    () => resolveSharedJestCli(resolveBin),
  );
}
export default resolveJestCli;
