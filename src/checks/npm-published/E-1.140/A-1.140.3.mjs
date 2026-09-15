import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../../ghcr-published/read-workflows.mjs";
import { hasUbuntuRunner, validationJobs } from "../../ghcr-published/workflow-policy.mjs";
import { npmPublicationJobs } from "../../ghcr-published/workflow-publication.mjs";
import { steps } from "../../ghcr-published/workflow-structure.mjs";

export const ruleId = "A-1.140.3";
export const parentRuleId = "E-1.140";

export function publicationNeeds(job) {
  return Array.isArray(job?.needs) ? job.needs : job?.needs ? [job.needs] : [];
}

export async function run({ root }) {
  try {
    const workflows = await readWorkflows(root);
    if (!workflows.some((workflow) => npmPublicationJobs(workflow).length > 0)) return fail(ruleId, "npm-published repositories must define a publication workflow.");
    for (const workflow of workflows) {
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
        !validation.some(({ job }) => hasUbuntuRunner(workflow, job) &&
          steps(job).some(({ run }) => /^npm\s+ci$/iu.test(String(run ?? "").trim())) &&
          steps(job).some(({ run }) => /^npm\s+test$/iu.test(String(run ?? "").trim()))) ||
        publication.some(({ job }) => {
          const needs = publicationNeeds(job);
          return !needs.some((id) => validation.some((item) => item.id === id)) || /always\s*\(/iu.test(String(job.if ?? ""));
        })
      )
        return fail(
          ruleId,
          `Publication workflow must inherit the validation gate: ${workflow.name}.`,
        );
    }
  } catch (error) {
    return fail(ruleId, `npm publication workflows could not be read: ${error.message}`);
  }
  return pass(ruleId);
}
