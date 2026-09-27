const timingReportStart = '{"numFailedTestSuites"';

export function selectJestTimingOutput({ stdout = "", stderr = "" } = {}) {
  if (stdout.includes(timingReportStart)) return stdout;
  if (stderr.includes(timingReportStart)) return stderr;
  return [stdout, stderr].filter(Boolean).join("\n");
}
