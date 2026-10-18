import { collectLauncherAliases } from "../collect-launcher-aliases.mjs";
import { collectStaticStrings } from "./collect/static-strings.mjs";
import { visitTestToolUse } from "./test-tool-use/visit.mjs";

export function analyzeTestToolUse(program, allowHarnessTools = false) {
  const strings = collectStaticStrings(program);
  const launchNames = collectLauncherAliases(program);
  return visitTestToolUse(program, strings, launchNames, allowHarnessTools);
}
