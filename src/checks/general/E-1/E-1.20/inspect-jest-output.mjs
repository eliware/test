import { parseJsonOutput } from "./parse-jest-output.mjs";
import { findUnexpectedJestLines } from "./find-unexpected-jest-lines.mjs";
import { findSlowTestFindings } from "./find-slow-test-findings.mjs";
import { findJestConsoleOutput } from "./find-jest-console-output.mjs";

export function findUnexpectedJestOutput({ stdout = "", stderr = "" } = {}) {
  const parsed = parseJsonOutput(stdout);
  const findings = findUnexpectedJestLines(parsed.text);
  findings.push(...findSlowTestFindings(stderr));
  findings.push(...findJestConsoleOutput(parsed.report));
  findings.push(...findUnexpectedJestLines(stderr).filter((line) =>
    !line.startsWith("[eliware-test] ") && !line.startsWith("[eliware-test-progress] ") && !/^E-1\.20(?::|\.)/.test(line),
  ));
  return [...new Set(findings)];
}
