export function selectUsableReport(candidates = []) {
  if (!Array.isArray(candidates)) throw new TypeError('selectUsableReport requires candidates');
  return candidates.find((candidate) => candidate && candidate.usable === true) ?? null;
}

export function hasUsableReport(report) {
  return Boolean(report && report.usable === true);
}
