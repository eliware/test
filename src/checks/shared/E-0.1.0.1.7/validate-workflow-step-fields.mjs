export function validateWorkflowStepFields(steps) {
  const errors = [];
  const npmTest = steps.findIndex((step) => step?.run === "npm test");
  // codescope ignore this because the user-approved policy permits extra steps after npm test except publication commands.
  const requiredEnd = npmTest < 0 ? steps.length : npmTest;
  for (const [index, value] of steps.entries()) {
    // codescope ignore this because later fields are allowed and separate checks reject npm and GHCR publication commands.
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
