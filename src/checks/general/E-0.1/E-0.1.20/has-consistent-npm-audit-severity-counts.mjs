const severities = ["info", "low", "moderate", "high", "critical"];
const protectedSeverities = new Set(["high", "critical"]);

export function hasConsistentNpmAuditSeverityCounts(report) {
  const findings = [];
  for (const [name, finding] of Object.entries(report.vulnerabilities)) {
    if (
      finding !== null &&
      typeof finding === "object" &&
      !Array.isArray(finding) &&
      finding.name !== undefined &&
      finding.name !== name
    )
      return false;
    findings.push(finding);
  }
  const reportedCounts = Object.fromEntries(severities.map((severity) => [severity, 0]));
  if (
    findings.some(
      (finding) =>
        finding === null ||
        typeof finding !== "object" ||
        Array.isArray(finding) ||
        !severities.includes(finding.severity) ||
        protectedSeverities.has(finding.severity),
    )
  ) {
    return false;
  }
  for (const finding of findings) reportedCounts[finding.severity] += 1;
  const vulnerabilities = report.metadata?.vulnerabilities;
  if (
    vulnerabilities === null ||
    typeof vulnerabilities !== "object" ||
    Array.isArray(vulnerabilities) ||
    severities.some(
      (severity) =>
        !Number.isSafeInteger(vulnerabilities[severity]) || vulnerabilities[severity] < 0,
    )
  ) {
    return false;
  }
  const reportedTotal = severities.reduce(
    (total, severity) => total + vulnerabilities[severity],
    0,
  );
  return (
    Number.isSafeInteger(reportedTotal) &&
    vulnerabilities.total === reportedTotal &&
    severities.every((severity) => vulnerabilities[severity] === reportedCounts[severity]) &&
    vulnerabilities.high === 0 &&
    vulnerabilities.critical === 0
  );
}
