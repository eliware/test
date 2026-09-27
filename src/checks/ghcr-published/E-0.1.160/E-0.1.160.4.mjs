import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { permissions } from "../workflow-permissions.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";

export const ruleId = "E-0.1.160.4";
export const parentRuleId = "E-0.1.160";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run(context) {
  const { root } = context;
  try {
    const publications = (await readWorkflows(root, context)).filter(isPublicationWorkflow);
    if (publications.length === 0)
      return fail(ruleId, "GHCR publication must grant only the required permissions.");
    for (const publication of publications)
      for (const { job } of publicationJobs(publication)) {
        const granted = permissions(publication, job);
        const required = new Map([
          ["contents", "read"],
          ["packages", "write"],
          ["id-token", "write"],
          ["attestations", "write"],
          ["artifact-metadata", "write"],
        ]);
        const exact =
          Object.keys(granted).length === required.size &&
          [...required].every(([key, value]) => granted[key] === value);
        if (!exact)
          return fail(
            ruleId,
            "GHCR publication must grant only the permissions required by its selected operations.",
          );
      }
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
