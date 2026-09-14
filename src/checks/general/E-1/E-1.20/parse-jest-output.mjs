export function parseJsonOutput(output) {
  const start = output.indexOf('{"numFailedTestSuites"');
  if (start < 0) return { text: output, report: null };
  const json = output.slice(start);
  try {
    return { text: output.slice(0, start), report: JSON.parse(json) };
  } catch {
    return { text: output, report: null };
  }
}
