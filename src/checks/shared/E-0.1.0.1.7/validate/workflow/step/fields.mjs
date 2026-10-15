import { readCanonicalOrder } from "../../../../../../validation/shared/conventions/read-canonical-order.mjs";

export function validateWorkflowStepFields(steps, workflowName = "ci.yaml") {
  const errors = [];
  const checkoutOptions = readCanonicalOrder("ci-workflow.yaml").checkoutOptions;
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
      JSON.stringify(step.with ?? {}) !== JSON.stringify(checkoutOptions)
    )
      errors.push(`${workflowName} checkout must set the canonical full-history options.`);
  }
  return errors;
}
