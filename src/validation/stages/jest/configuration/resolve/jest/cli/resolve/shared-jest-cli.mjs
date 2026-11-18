import { createRequire } from "node:module";
import resolveJestBin from "../../bin.mjs";
function resolveSharedJestCli(
  resolveBin = resolveJestBin,
  requireFromHarness = createRequire(import.meta.url),
) {
  return resolveBin(requireFromHarness, "jest") ?? resolveBin(requireFromHarness, "jest-cli");
}
export default resolveSharedJestCli;
