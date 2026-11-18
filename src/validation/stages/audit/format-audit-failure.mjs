function parseAuditReport(stdout) {
  if (typeof stdout !== "string" || !stdout.trim()) return null;
  try {
    const report = JSON.parse(stdout);
    return report && typeof report === "object" ? report : null;
  } catch {
    return null;
  }
}
export default function auditFailureIsExempt(value, advisoryIds = []) {
  const report = parseAuditReport(value?.stdout);
  const vulnerabilities = report?.vulnerabilities;
  if (!vulnerabilities || typeof vulnerabilities !== "object") return false;
  const allowed = new Set(advisoryIds.map((id) => id.toLowerCase()));
  if (allowed.size === 0) return false;
  return areSevereAuditFindingsExempt(vulnerabilities, allowed);
}
import areSevereAuditFindingsExempt from "./audit-exemption/causes.mjs";
