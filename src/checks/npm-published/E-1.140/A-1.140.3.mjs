import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../../ghcr-published/read-workflows.mjs";
import { validationJobs } from "../../ghcr-published/workflow-policy.mjs";
import { npmPublicationJobs } from "../../ghcr-published/workflow-publication.mjs";

export const ruleId = "A-1.140.3";
export const parentRuleId = "E-1.140";

export async function run({ root }) {
  try {
    for (const workflow of await readWorkflows(root)) {
      const publication = npmPublicationJobs(workflow);
      if (publication.length === 0) {
        if (/\bnpm\s+publish\b/i.test(workflow.content)) {
          return fail(ruleId, `Publication workflow could not be parsed: ${workflow.name}.`);
        }
        continue;
      }
      const validation = validationJobs(workflow);
      if (
        validation.length === 0 ||
        publication.some(({ job }) => {
          const needs = Array.isArray(job.needs) ? job.needs : job.needs ? [job.needs] : [];
          return !needs.some((id) => validation.some((item) => item.id === id));
        })
      )
        return fail(
          ruleId,
          `Publication workflow must inherit the validation gate: ${workflow.name}.`,
        );
    }
  } catch {
    return pass(ruleId);
  }
  return pass(ruleId);
}
