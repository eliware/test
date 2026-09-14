import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { stepText, steps } from "../workflow-structure.mjs";

export const ruleId = "E-1.160.8";
export const parentRuleId = "E-1.160";

export async function run({ root }) {
  try {
    const publication = (await readWorkflows(root)).find(isPublicationWorkflow);
    const verified =
      publication &&
      publicationJobs(publication).some(({ job }) =>
        steps(job).some((step) =>
          /docker\s+(?:buildx\s+imagetools\s+)?inspect|verify\s+digest/i.test(stepText(step)),
        ),
      );
    if (!publication || !verified)
      return fail(ruleId, "GHCR publication must expose and verify the pushed image digest.");
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
