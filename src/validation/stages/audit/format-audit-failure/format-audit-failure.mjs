function parseAuditReport(stdout) {
  if (typeof stdout !== "string" || !stdout.trim()) return null;
  try {
    const report = JSON.parse(stdout);
    return report && typeof report === "object" ? report : null;
  } catch {
    return null;
  }
}
function collectAdvisories(vulnerabilities) {
  const advisories = new Map();
  for (const vulnerability of Object.values(vulnerabilities ?? {})) {
    if (!vulnerability || typeof vulnerability !== "object") continue;
    for (const item of vulnerability.via ?? []) {
      if (!item || typeof item !== "object" || !item.title) continue;
      const key = `${item.source ?? item.url ?? item.title}`;
      const affected = advisories.get(key) ?? new Set();
      if (vulnerability.name) affected.add(vulnerability.name);
      advisories.set(key, affected);
      if (!advisories.has(`${key}:details`)) {
        advisories.set(`${key}:details`, {
          title: item.title,
          severity: item.severity ?? vulnerability.severity ?? "unknown",
          url: item.url,
          range: item.range,
        });
      }
    }
  }
  return [...advisories.entries()]
    .filter(([key]) => !key.endsWith(":details"))
    .map(([key, packages]) => ({
      ...advisories.get(`${key}:details`),
      packages: [...packages],
    }));
}
function formatAuditFailure(value) {
  const report = parseAuditReport(value?.stdout);
  const counts = report?.metadata?.vulnerabilities;
  if (counts && typeof counts === "object") {
    const summary = ["info", "low", "moderate", "high", "critical"]
      .filter((severity) => Number(counts[severity]) > 0)
      .map((severity) => `${counts[severity]} ${severity}`)
      .join(", ");
    const lines = [
      `npm audit found ${counts.total ?? "unknown"} vulnerabilities${summary ? ` (${summary})` : ""}.`,
    ];
    for (const advisory of collectAdvisories(report.vulnerabilities)) {
      const packages = advisory.packages.length
        ? ` Affected packages: ${advisory.packages.join(", ")}.`
        : "";
      const range = advisory.range ? ` Affected versions: ${advisory.range}.` : "";
      const url = advisory.url ? ` ${advisory.url}` : "";
      lines.push(`${advisory.severity}: ${advisory.title}.${range}${packages}${url}`);
    }
    return lines.join("\n");
  }
  const details = [value?.stderr, value?.stdout]
    .filter((text) => typeof text === "string" && text.trim())
    .map((text) => text.trim())
    .join("\n");
  return details || "npm returned no audit details. Run npm audit --json for the report.";
}
export default formatAuditFailure;
