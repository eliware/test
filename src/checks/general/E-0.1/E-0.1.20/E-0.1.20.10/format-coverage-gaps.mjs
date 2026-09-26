function details(items, formatter) {
  const visible = items.slice(0, 20).map(formatter).join(", ") || "-";
  const omitted = items.length - 20;
  return omitted > 0 ? `${visible} (+${omitted} more omitted)` : visible;
}

export function formatCoverageGaps(evidence) {
  const lines = ["Coverage gaps:", "File | Statements | Branches | Functions | Lines"];
  for (const gap of evidence.gaps) {
    lines.push(
      `${gap.file} | ${gap.metrics.statements.toFixed(2)}% | ${gap.metrics.branches.toFixed(2)}% | ${gap.metrics.functions.toFixed(2)}% | ${gap.metrics.lines.toFixed(2)}% | uncovered lines: ${gap.lines.join(", ") || "-"}`,
      `  Uncovered statements: ${details(gap.statements, ({ location }) => location)}`,
      `  Uncovered branches: ${details(gap.branches, ({ location }) => `${location} (uncovered)`)}`,
      `  Uncovered functions: ${details(gap.functions, ({ name, location }) => `${name} at ${location}`)}`,
    );
  }
  lines.push(
    "",
    "Remediation: Add or extend tests to execute each listed statement, branch, and function path.",
    "Refactor the implementation only when necessary for testability. Remove truly unreachable branches.",
    "Istanbul ignore directives are authorized only in pure barrel files.",
  );
  return lines.join("\n");
}
