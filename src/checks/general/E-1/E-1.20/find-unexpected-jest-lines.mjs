const JEST_LINES = [
  /^(?:PASS|FAIL)\s/, /^Test Suites:/, /^Tests:/, /^Snapshots:/, /^Time:/, /^Ran all test suites/,
  /^Coverage summary/, /^File\s+\|/, /^[\s|%_.-]+$/, /^\s*(?:All files|[^\s|]+)\s+\|/,
  /^\s*(?:Expected|Received|Difference):/, /^\s*at\s/, /^\s*[✓√✕×○]\s/, /^\s*●\s/, /^\s*>\s/,
  /^\s*Node\.js\s+v/, /^\s*Test Suites:/, /^\s*Tests:/, /^\s*Snapshots:/,
];
const ANSI_ESCAPE = new RegExp(`${String.fromCodePoint(0x1b)}\\[[0-?]*[ -/]*[@-~]`, "gu");

export function findUnexpectedJestLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(ANSI_ESCAPE, "").trim())
    .filter((line) => line && !/^\[?eliware-test-progress\]?\s/u.test(line) && !/^\[?eliware-test\]?\s/u.test(line) && !JEST_LINES.some((pattern) => pattern.test(line)));
}
