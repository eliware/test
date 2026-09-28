import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../../ghcr-published/read-workflows.mjs";
import { npmPublicationJobs } from "../npm-publication-jobs.mjs";
import { validateNpmPublicationWorkflow } from "./validate-npm-publication-workflow.mjs";

export const ruleId = "A-0.1.140.2";
export const parentRuleId = "E-0.1.140";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run(context) {
  const { root, packageJson } = context;
  const env = context.env ?? process.env;
  let workflows;
  try {
    workflows = await readWorkflows(root, context);
  } catch (error) {
    return fail(ruleId, `npm publication workflows could not be read: ${error.message}`);
  }
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
    if (!validateNpmPublicationWorkflow(workflow, packageJson?.version, env)) {
      failures.push(
        `Publication workflow must use exact version tags, verify package version, and validate on Ubuntu: ${workflow.name}.`,
      );
    }
  }
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
