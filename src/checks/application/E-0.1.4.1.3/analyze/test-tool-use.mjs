import { visitTestToolUse } from "./test-tool-use/visit.mjs";
import { prepareTestToolUse } from "./prepare-test-tool-use.mjs";

export function analyzeTestToolUse(program, allowHarnessTools = false) {
  const prepared = prepareTestToolUse(program);
  return visitTestToolUse(program, prepared.strings, prepared.launchNames, allowHarnessTools);
}
