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
          ? ["uses", "with"]
          : ["run"];
    if (Object.keys(step).some((key) => !allowed.includes(key)))
      errors.push("ci.yaml steps must use only approved keys and inputs.");
    if (
      step?.uses === "actions/checkout@v6" &&
      step.with !== undefined &&
      (Object.keys(step.with ?? {}).length !== 1 || step.with?.["fetch-depth"] !== 0)
    )
      errors.push("ci.yaml checkout may set only fetch-depth: 0.");
  }
  return errors;
}
