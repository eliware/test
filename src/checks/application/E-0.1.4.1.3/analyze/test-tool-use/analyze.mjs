import prepareTestToolUse from "../prepare-test-tool-use.mjs";
import visitTestToolUse from "./visit.mjs";
export default function analyzeTestToolUseProgram(program, allowHarnessTools = false) {
  const prepared = prepareTestToolUse(program);
  return visitTestToolUse(program, prepared.strings, prepared.launchNames, allowHarnessTools);
}
