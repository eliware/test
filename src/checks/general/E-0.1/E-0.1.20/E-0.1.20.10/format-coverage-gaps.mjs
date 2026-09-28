function details(items, formatter) {
  const visible = items.slice(0, 20).map(formatter).join(", ") || "-";
  const omitted = items.length - 20;
  return omitted > 0 ? `${visible} (+${omitted} more omitted)` : visible;
}

function metric(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)}%` : "unavailable";
}

export function formatCoverageGaps(evidence) {
  const lines = ["Coverage gaps:", "File | Statements | Branches | Functions | Lines"];
  for (const gap of evidence.gaps) {
    lines.push(
      `${gap.file} | ${metric(gap.metrics.statements)} | ${metric(gap.metrics.branches)} | ${metric(gap.metrics.functions)} | ${metric(gap.metrics.lines)} | uncovered lines: ${gap.lines.join(", ") || "-"}`,
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
