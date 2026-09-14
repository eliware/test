import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { stepText, steps } from "../workflow-structure.mjs";

export const ruleId = "E-1.160.7";
export const parentRuleId = "E-1.160";

export async function run({ root }) {
  try {
    const publication = (await readWorkflows(root)).find(isPublicationWorkflow);
    const published =
      publication &&
      publicationJobs(publication).some(({ job }) =>
        steps(job).some((step) => /sha256|digest/i.test(stepText(step))),
      );
    if (
      !publication ||
      !published ||
      steps(publicationJobs(publication)[0]?.job).some((step) => /:latest\b/i.test(stepText(step)))
    )
      return fail(
        ruleId,
        "GHCR release identity must use an exact version tag and recorded digest, not latest.",
      );
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
