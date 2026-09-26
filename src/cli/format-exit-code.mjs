const descriptions = new Map([
  [8, "Jest failure"],
  [10, "coverage failure"],
  [12, "lint failure"],
  [14, "internal tool failure"],
  [17, "package-check failure"],
  [18, "convention, configuration, argument, format, or format-check failure"],
]);

export function formatExitCode(code) {
  if (code === 0) return "Exit-code: 0";
  return `Exit-code: ${code} (${descriptions.get(code) ?? "unclassified failure"})`;
}
