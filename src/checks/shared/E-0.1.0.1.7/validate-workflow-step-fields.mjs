export function validateWorkflowStepFields(steps) {
  const errors = [];
  const npmTest = steps.findIndex((step) => step?.run === "npm test");
  const requiredEnd = npmTest < 0 ? steps.length : npmTest;
  for (const [index, value] of steps.entries()) {
    if (index > requiredEnd) continue;
    const step = value ?? {};
    const allowed =
      step?.uses === "actions/setup-node@v7"
        ? ["uses", "with"]
        : step?.uses === "actions/checkout@v6"
          ? ["uses"]
          : ["run"];
    if (Object.keys(step).some((key) => !allowed.includes(key)))
      errors.push("ci.yaml steps must use only approved keys and inputs.");
  }
  return errors;
}
