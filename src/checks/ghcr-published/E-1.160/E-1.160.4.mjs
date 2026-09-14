import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { permissions } from "../workflow-policy.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";

export const ruleId = "E-1.160.4";
export const parentRuleId = "E-1.160";

export async function run({ root }) {
  try {
    const publication = (await readWorkflows(root)).find(isPublicationWorkflow);
    const job = publication && publicationJobs(publication)[0]?.job;
    const granted = permissions(publication, job);
    const allowed = new Set([
      "contents",
      "packages",
      "id-token",
      "attestations",
      "artifact-metadata",
    ]);
    if (
      !publication ||
      granted.contents !== "read" ||
      granted.packages !== "write" ||
      Object.keys(granted).some((key) => !allowed.has(key))
    )
      return fail(
        ruleId,
        "GHCR publication must grant only the required read and package-write permissions.",
      );
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
