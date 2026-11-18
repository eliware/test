import analyzeTestToolUseProgram from "./test-tool-use/analyze.mjs";
export default function analyzeTestToolUse(program, allowHarnessTools = false) {
  return analyzeTestToolUseProgram(program, allowHarnessTools);
}
