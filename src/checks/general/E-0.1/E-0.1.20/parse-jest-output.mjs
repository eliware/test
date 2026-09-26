export function parseJsonOutput(output) {
  const key = output.indexOf('"numFailedTestSuites"');
  if (key < 0) return { text: output, report: null };
  const start = output.lastIndexOf("{", key);
  if (start < 0) return { text: output, report: null };
  const json = output.slice(start);
  try {
    return { text: output.slice(0, start), report: JSON.parse(json) };
  } catch {
    return { text: output, report: null };
  }
}
