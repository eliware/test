const descriptions = new Map([
  [1, "unclassified or configuration failure"],
  [2, "Jest test failure"],
  [3, "unexpected test output"],
  [4, "coverage failure"],
  [5, "lint failure"],
  [6, "format failure"],
  [7, "npm audit failure"],
  [8, "npm outdated failure"],
  [9, "npm pack failure"],
  [10, "typecheck failure"],
  [11, "build failure"],
  [12, "convention failure"],
]);

export function formatExitCode(code) {
  if (code === 0) return "Exit-code: 0";
  return `Exit-code: ${code} (${descriptions.get(code) ?? "unclassified failure"})`;
}
