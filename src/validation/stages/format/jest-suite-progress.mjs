export function formatJestSuiteProgress(event) {
  if (event.event === "start" && typeof event.path === "string")
    return [`Running ${event.path}...`];
  if (event.event !== "result") return [];
  const output = [];
  if (event.failed) {
    if (event.failures?.length) output.push(`\n${event.failures.join("\n")}\n`);
    if (event.unexpectedOutput?.length)
      output.push(`\nUnexpected output:\n${event.unexpectedOutput.join("\n")}\n`);
  }
  output.push(`${event.failed ? " FAIL" : " PASS"} - ${event.duration}s\n`);
  return output;
}
