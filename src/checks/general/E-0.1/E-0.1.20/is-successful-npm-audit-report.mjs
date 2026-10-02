import { hasConsistentNpmAuditSeverityCounts } from "./has-consistent-npm-audit-severity-counts.mjs";

export function getValidNpmAuditReport(stdout, requirements = {}) {
  if (Number.isInteger(requirements)) requirements = { minimumDependencyCount: requirements };
  const { minimumDependencyCount = 0, categories = {} } = requirements;
  try {
    const report = JSON.parse(stdout);
    if (report === null || typeof report !== "object" || Array.isArray(report)) return null;
    if (report.auditReportVersion !== 2) return null;
    const auditedDependencies = report.metadata?.dependencies?.total;
    if (
      minimumDependencyCount > 0 &&
      (!Number.isInteger(auditedDependencies) || auditedDependencies < minimumDependencyCount)
    )
      return null;
    const auditedCategories = report.metadata?.dependencies;
    if (
      Object.entries(categories).some(
        ([category, minimum]) =>
          !Number.isInteger(auditedCategories?.[category]) || auditedCategories[category] < minimum,
      )
    )
      return null;
    if (
      report.vulnerabilities === null ||
      typeof report.vulnerabilities !== "object" ||
      Array.isArray(report.vulnerabilities) ||
      !hasConsistentNpmAuditSeverityCounts(report)
    )
      return null;
    return report;
  } catch {
    return null;
  }
}

export function isSuccessfulNpmAuditReport(stdout, requirements = {}) {
  const report = getValidNpmAuditReport(stdout, requirements);
  return Boolean(
    report &&
    report.metadata.vulnerabilities.high === 0 &&
    report.metadata.vulnerabilities.critical === 0,
  );
}
