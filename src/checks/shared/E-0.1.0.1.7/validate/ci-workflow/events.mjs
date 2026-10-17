export function validateCiWorkflowEvents(document) {
  const errors = [];
  rejectUnknownKeys(
    document,
    ["name", "on", "true", "concurrency", "permissions", "jobs"],
    "workflow",
    errors,
  );
  const events = document.on ?? document.true;
  if (events && Object.keys(events).some((event) => !["push", "pull_request"].includes(event)))
    errors.push("ci.yaml must define only push and pull_request events.");
  for (const event of ["push", "pull_request"]) {
    if (!events?.[event]?.branches?.includes("main"))
      errors.push(`ci.yaml must enable ${event} for main.`);
    if (
      Object.keys(events?.[event] ?? {}).some((key) => key !== "branches") ||
      JSON.stringify(events?.[event]?.branches) !== '["main"]'
    )
      errors.push(`ci.yaml ${event} must define only the main branch.`);
  }
  if (
    document.concurrency?.group !== "${{ github.repository }}-${{ github.ref }}" ||
    document.concurrency?.["cancel-in-progress"] !== true
  )
    errors.push("ci.yaml must set repository-and-ref concurrency with cancellation enabled.");
  rejectUnknownKeys(document.concurrency, ["group", "cancel-in-progress"], "concurrency", errors);
  return errors;
}

function rejectUnknownKeys(value, allowed, label, errors) {
  const unknown = Object.keys(value ?? {}).filter((key) => !allowed.includes(key));
  if (unknown.length) errors.push(`ci.yaml ${label} has unsupported keys: ${unknown.join(", ")}.`);
}
