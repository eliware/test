const JEST_LINES = [
  /^(?:PASS|FAIL)\s/, /^Test Suites:/, /^Tests:/, /^Snapshots:/, /^Time:/, /^Ran all test suites/,
  /^Coverage summary/, /^File\s+\|/, /^[\s|%_.-]+$/, /^\s*(?:All files|[^\s|]+)\s+\|/,
  /^\s*(?:Expected|Received|Difference):/, /^\s*at\s/, /^\s*[✓√✕×○]\s/, /^\s*●\s/, /^\s*>\s/,
  /^\s*Node\.js\s+v/, /^\s*Test Suites:/, /^\s*Tests:/, /^\s*Snapshots:/,
];

export function findUnexpectedJestLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() && !line.startsWith("[eliware-test-progress] ") && !JEST_LINES.some((pattern) => pattern.test(line)));
}
