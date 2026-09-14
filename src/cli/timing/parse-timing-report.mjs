export function parseTimingReport(output) {
  const start = output.indexOf('{"numFailedTestSuites"');
  if (start < 0) throw new Error("Jest timing JSON was not found");
  return JSON.parse(output.slice(start));
}
