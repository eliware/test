export function validateWorkflowStepFields(steps) {
  const errors = [];
  for (const step of steps.map((value) => value ?? {})) {
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
