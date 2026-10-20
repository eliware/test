export function formatJestSuiteProgress(event, elapsed = "0.000") {
  if (event.event === "start" && typeof event.path === "string")
    return [`[${elapsed}s] ${event.path}...`];
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
