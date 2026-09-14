import { access } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { stepText, steps } from "../workflow-structure.mjs";

export const ruleId = "E-1.160.6";
export const parentRuleId = "E-1.160";

export async function run({ root }) {
  try {
    await access(join(root, "Dockerfile"));
    const publication = (await readWorkflows(root)).find(isPublicationWorkflow);
    if (
      !publication ||
      !publicationJobs(publication).some(({ job }) =>
        steps(job).some(
          (step) =>
            /docker\/build-push-action/i.test(step.uses ?? "") ||
            /docker\s+build/i.test(stepText(step)),
        ),
      )
    )
      return fail(
        ruleId,
        "GHCR repositories must build their owned Dockerfile in a publication workflow.",
      );
  } catch (error) {
    return fail(ruleId, `GHCR build definition could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
