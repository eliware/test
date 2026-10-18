import { readFileSync } from "node:fs";
import { readCanonicalOrder } from "../../../validation/shared/conventions/read-canonical-order.mjs";

const workflowDirectory = new URL("../../../../specs/workflows/", import.meta.url);

export async function validateCanonicalPublisherWorkflow(
  inventory,
  profile,
  readCanonical = (url) => readFileSync(url, "utf8"),
) {
  const file = readCanonicalOrder("publication-workflow.yaml").workflowFiles[profile];
  if (!file) return [`Unsupported publisher profile: ${profile}.`];
  const path = `.github/workflows/${file}`;
  if (!inventory?.files || !inventory.readText) return [`${path} could not be inspected.`];
  try {
    if (!(await inventory.files("all")).includes(path)) return [`${path} is required.`];
    const actual = await inventory.readText(path);
    const expected = await readCanonical(new URL(file, workflowDirectory));
    return actual === expected
      ? []
      : [`${path} must match the bundled Eliware Test file specs/workflows/${file} byte for byte.`];
  } catch (error) {
    return [`${path} could not be inspected: ${error.message}`];
  }
}
