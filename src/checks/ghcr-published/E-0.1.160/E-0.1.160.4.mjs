import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { permissions } from "../workflow-permissions.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import {
  hasExactPublicationPermissions,
  hasReadOnlyWorkflowPermissions,
} from "../expected-publication-permissions.mjs";

export const ruleId = "E-0.1.160.4";
export const parentRuleId = "E-0.1.160";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run(context) {
  const { root, packageJson } = context;
  try {
    const publications = (await readWorkflows(root, context)).filter(isPublicationWorkflow);
    if (publications.length === 0)
      return fail(ruleId, "GHCR publication must grant only the required permissions.");
    const failures = [];
    for (const publication of publications) {
      if (!hasReadOnlyWorkflowPermissions(publication.document?.permissions))
        failures.push(
          `GHCR workflow-level permissions must be limited to contents: read: ${publication.name}.`,
        );
      for (const { id, job } of publicationJobs(publication)) {
        const granted = permissions(publication, job);
        const expectedProfiles = [
          "ghcr-published",
          ...(packageJson?.eliware?.apply ?? []).filter((profile) => profile === "npm-published"),
        ];
        const exact = hasExactPublicationPermissions(granted, expectedProfiles);
        if (!exact)
          failures.push(
            `GHCR publication must grant only the permissions required by its selected operations: ${publication.name} job ${id}.`,
          );
      }
    }
    if (failures.length) return fail(ruleId, failures.join("\n"));
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
