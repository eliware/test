export function isSuccessfulNpmAuditReport(stdout) {
  try {
    const report = JSON.parse(stdout);
    if (report === null || typeof report !== "object" || Array.isArray(report)) return false;
    const vulnerabilities = report.vulnerabilities;
    if (vulnerabilities === null || typeof vulnerabilities !== "object" || Array.isArray(vulnerabilities)) {
      return false;
    }
    return ["high", "critical"].every((severity) =>
      Number.isInteger(vulnerabilities[severity]) && vulnerabilities[severity] === 0,
    );
  } catch {
    return false;
  }
}
