import { hasConsistentNpmAuditSeverityCounts } from "./has-consistent-npm-audit-severity-counts.mjs";

export function isSuccessfulNpmAuditReport(stdout, requirements = {}) {
  if (Number.isInteger(requirements)) requirements = { minimumDependencyCount: requirements };
  const { minimumDependencyCount = 0, categories = {} } = requirements;
  try {
    const report = JSON.parse(stdout);
    if (report === null || typeof report !== "object" || Array.isArray(report)) return false;
    if (report.auditReportVersion !== 2) return false;
    const auditedDependencies = report.metadata?.dependencies?.total;
    if (
      minimumDependencyCount > 0 &&
      (!Number.isInteger(auditedDependencies) || auditedDependencies < minimumDependencyCount)
    )
      return false;
    const auditedCategories = report.metadata?.dependencies;
    if (
      Object.entries(categories).some(
        ([category, minimum]) =>
          !Number.isInteger(auditedCategories?.[category]) || auditedCategories[category] < minimum,
      )
    )
      return false;
    if (
      report.vulnerabilities === null ||
      typeof report.vulnerabilities !== "object" ||
      Array.isArray(report.vulnerabilities)
    ) {
      return false;
    }
    return hasConsistentNpmAuditSeverityCounts(report);
  } catch {
    return false;
  }
}
