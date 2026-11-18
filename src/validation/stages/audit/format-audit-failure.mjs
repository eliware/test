function parseAuditReport(stdout) {
  if (typeof stdout !== "string" || !stdout.trim()) return null;
  try {
    const report = JSON.parse(stdout);
    return report && typeof report === "object" ? report : null;
  } catch {
    return null;
  }
}
function isSevere(severity) {
  return severity === "high" || severity === "critical";
}
function causeIsExempt(name, vulnerabilities, advisoryIds, visited = new Set()) {
  if (visited.has(name)) return false;
  const vulnerability = vulnerabilities[name];
  if (!vulnerability || !Array.isArray(vulnerability.via) || vulnerability.via.length === 0)
    return false;
  const nextVisited = new Set(visited).add(name);
  return vulnerability.via.every((cause) => {
    if (typeof cause === "string") {
      const linked = vulnerabilities[cause];
      if (!linked) return false;
      return (
        !isSevere(linked.severity) ||
        causeIsExempt(cause, vulnerabilities, advisoryIds, nextVisited)
      );
    }
    if (!cause || typeof cause !== "object") return false;
    if (!isSevere(cause.severity ?? vulnerability.severity)) return true;
    const match =
      typeof cause.url === "string"
        ? cause.url.match(/GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}/iu)
        : null;
    return Boolean(match && advisoryIds.has(match[0].toLowerCase()));
  });
}
export default function auditFailureIsExempt(value, advisoryIds = []) {
  const report = parseAuditReport(value?.stdout);
  const vulnerabilities = report?.vulnerabilities;
  if (!vulnerabilities || typeof vulnerabilities !== "object") return false;
  const allowed = new Set(advisoryIds.map((id) => id.toLowerCase()));
  if (allowed.size === 0) return false;
  const severeEntries = Object.entries(vulnerabilities).filter(([, item]) =>
    isSevere(item?.severity),
  );
  return (
    severeEntries.length > 0 &&
    severeEntries.every(([name]) => causeIsExempt(name, vulnerabilities, allowed))
  );
}
