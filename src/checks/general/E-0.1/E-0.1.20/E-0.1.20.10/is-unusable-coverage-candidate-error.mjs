export function isUnusableCoverageCandidateError(error) {
  if (error === null || (typeof error !== "object" && typeof error !== "function")) return false;
  const message = error instanceof Error ? error.message : "";
  return (
    error.code === "ENOENT" ||
    error instanceof SyntaxError ||
    message.startsWith("Detailed coverage") ||
    message.startsWith("Coverage report does not account") ||
    message.startsWith("Coverage report is") ||
    message.startsWith("Coverage evidence is") ||
    message.startsWith("Coverage evidence has an invalid shape") ||
    message.startsWith("Coverage map and counter keys") ||
    message.startsWith("Coverage line counters do not match source-derived line coverage") ||
    message.startsWith("Summary-only coverage")
  );
}
