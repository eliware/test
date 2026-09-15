import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { permissions } from "../workflow-policy.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { steps } from "../workflow-structure.mjs";

export const ruleId = "E-1.160.4";
export const parentRuleId = "E-1.160";

export async function run({ root }) {
  try {
    const publications = (await readWorkflows(root)).filter(isPublicationWorkflow);
    if (publications.length === 0) return fail(ruleId, "GHCR publication must grant only the required permissions.");
    for (const publication of publications) for (const { job } of publicationJobs(publication)) {
      const granted = permissions(publication, job);
      const jobSteps = steps(job);
      const required = new Map([["contents", "read"], ["packages", "write"]]);
      if (jobSteps.some((step) => step?.uses === "actions/attest@v4")) {
        required.set("id-token", "write");
        required.set("attestations", "write");
        required.set("artifact-metadata", "write");
      }
      const exact = Object.keys(granted).length === required.size &&
        [...required].every(([key, value]) => granted[key] === value);
      if (!exact)
        return fail(ruleId, "GHCR publication must grant only the permissions required by its selected operations.");
    }
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
