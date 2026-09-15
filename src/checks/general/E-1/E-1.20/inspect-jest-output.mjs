import { parseJsonOutput } from "./parse-jest-output.mjs";
import { findUnexpectedJestLines } from "./find-unexpected-jest-lines.mjs";
import { findSlowTestFindings } from "./find-slow-test-findings.mjs";
import { findJestConsoleOutput } from "./find-jest-console-output.mjs";

export function findUnexpectedJestOutput({ stdout = "", stderr = "" } = {}) {
  const parsed = parseJsonOutput(stdout);
  const suite = latestSuite(stderr);
  const findings = findUnexpectedJestLines(parsed.text)
    .filter((line) => line !== "…" && !/^\[?eliware(?:-test)?(?:-progress)?\b/u.test(line))
    .map((line) => formatUnexpected(line, suite));
  findings.push(...findSlowTestFindings(stderr));
  findings.push(...findJestConsoleOutput(parsed.report));
  findings.push(
    ...findUnexpectedJestLines(stderr)
      .filter((line) => line !== "…" && !/^\[?eliware-test(?:-progress)?\b/u.test(line) && !/^E-1\.20(?::|\.)/.test(line))
      .map((line) => formatUnexpected(line, suite)),
  );
  return [...new Set(findings)];
}

function latestSuite(stderr) {
  const suites = [...stderr.matchAll(/^\[eliware-test-progress\] start (.+)$/gmu)];
  return suites.at(-1)?.[1] ?? "unknown test suite";
}

function formatUnexpected(line, suite) {
  return `Unexpected output from ${suite}: ${line}`;
}
