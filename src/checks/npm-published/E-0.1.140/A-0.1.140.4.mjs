import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../../ghcr-published/read-workflows.mjs";
import { permissions } from "../../ghcr-published/workflow-permissions.mjs";
import { npmPublicationJobs } from "../npm-publication-jobs.mjs";
import { stepText, steps } from "../../ghcr-published/workflow-structure.mjs";
import { isApprovedNpmPublishCommand } from "./is-approved-npm-publish-command.mjs";

export const ruleId = "A-0.1.140.4";
export const parentRuleId = "E-0.1.140";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

function publicationIndex(job) {
  return steps(job).findIndex((step) => {
    return isApprovedNpmPublishCommand(stepText(step));
  });
}

export async function run(context) {
  const { root, packageJson } = context;
  try {
    const workflows = await readWorkflows(root, context);
    if (!workflows.some((workflow) => npmPublicationJobs(workflow).length > 0)) return fail(ruleId, "npm-published repositories must define a publication workflow.");
    for (const workflow of workflows) {
      const publication = npmPublicationJobs(workflow);
      if (publication.length === 0 && /\bnpm\s+publish\b/i.test(workflow.content)) {
        return fail(ruleId, `Publication workflow could not be parsed: ${workflow.name}.`);
      }
      for (const { job } of publication) {
        const granted = permissions(workflow, job);
        const allowed = new Set(["contents", "id-token"]);
        const packageName = typeof packageJson?.name === "string" ? packageJson.name : "";
        const publishAt = publicationIndex(job);
        if (
          (!packageName || publishAt < 0 ||
            (granted.contents !== "read" ||
            granted["id-token"] !== "write" ||
            Object.keys(granted).some((key) => !allowed.has(key)) ||
            /NPM_TOKEN|NODE_AUTH_TOKEN/i.test(JSON.stringify(job))))
        ) {
          return fail(
            ruleId,
            `Publication workflow must use least-privilege permissions: ${workflow.name}.`,
          );
        }
      }
    }
  } catch (error) {
    return fail(ruleId, `npm publication workflows could not be read: ${error.message}`);
  }
  return pass(ruleId);
}
