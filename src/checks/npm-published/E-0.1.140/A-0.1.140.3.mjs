import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../../ghcr-published/read-workflows.mjs";
import { hasUbuntuRunner } from "../../has-ubuntu-runner.mjs";
import { findValidationJobs } from "../../ghcr-published/find-validation-jobs.mjs";
import { npmPublicationJobs } from "../npm-publication-jobs.mjs";
import { steps } from "../../ghcr-published/workflow-structure.mjs";

export const ruleId = "A-0.1.140.3";
export const parentRuleId = "E-0.1.140";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export function publicationNeeds(job) {
  return Array.isArray(job?.needs) ? job.needs : job?.needs ? [job.needs] : [];
}

export async function run(context) {
  const { root } = context;
  try {
    const workflows = await readWorkflows(root, context);
    if (!workflows.some((workflow) => npmPublicationJobs(workflow).length > 0))
      return fail(ruleId, "npm-published repositories must define a publication workflow.");
    const failures = [];
    for (const workflow of workflows) {
      const publication = npmPublicationJobs(workflow);
      if (publication.length === 0) {
        if (/\bnpm\s+publish\b/i.test(workflow.content)) {
          failures.push(`Publication workflow could not be parsed: ${workflow.name}.`);
        }
        continue;
      }
      const validation = findValidationJobs(workflow);
      if (validation.length === 0) {
        failures.push(`Publication workflow must define a validation job: ${workflow.name}.`);
      } else if (
        !validation.some(
          ({ job }) =>
            hasUbuntuRunner(job) &&
            steps(job).some(({ run }) => /^npm\s+ci$/iu.test(String(run ?? "").trim())) &&
            steps(job).some(({ run }) => /^npm\s+test$/iu.test(String(run ?? "").trim())),
        )
      )
        failures.push(
          `Publication workflow must validate on Ubuntu before publishing: ${workflow.name}.`,
        );
      for (const { id, job } of publication) {
        const needs = publicationNeeds(job);
        if (
          !needs.some((needsId) => validation.some((item) => item.id === needsId)) ||
          /always\s*\(/iu.test(String(job.if ?? ""))
        )
          failures.push(
            `Publication workflow must inherit the validation gate: ${workflow.name} job ${id}.`,
          );
      }
    }
    if (failures.length) return fail(ruleId, failures.join("\n"));
  } catch (error) {
    return fail(ruleId, `npm publication workflows could not be read: ${error.message}`);
  }
  return pass(ruleId);
}
