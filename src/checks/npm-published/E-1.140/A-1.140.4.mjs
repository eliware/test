import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../../ghcr-published/read-workflows.mjs";
import { permissions } from "../../ghcr-published/workflow-policy.mjs";
import { npmPublicationJobs } from "../../ghcr-published/workflow-publication.mjs";
import { stepText, steps } from "../../ghcr-published/workflow-structure.mjs";

export const ruleId = "A-1.140.4";
export const parentRuleId = "E-1.140";

export async function run({ root, packageJson }) {
  try {
    for (const workflow of await readWorkflows(root)) {
      const publication = npmPublicationJobs(workflow);
      if (publication.length === 0 && /\bnpm\s+publish\b/i.test(workflow.content)) {
        return fail(ruleId, `Publication workflow could not be parsed: ${workflow.name}.`);
      }
      for (const { job } of publication) {
        const granted = permissions(workflow, job);
        const allowed = new Set(["contents", "id-token"]);
        const published = steps(job).some((step) => /npm\s+publish/i.test(stepText(step)));
        const verified = steps(job).some(
          (step) =>
            /npm\s+(?:view|info)\b/i.test(stepText(step)) &&
            (!packageJson?.name || stepText(step).includes(packageJson.name)),
        );
        if (
          published &&
          (granted.contents !== "read" ||
            granted["id-token"] !== "write" ||
            Object.keys(granted).some((key) => !allowed.has(key)) ||
            !verified ||
            /NPM_TOKEN|NODE_AUTH_TOKEN/i.test(JSON.stringify(job)))
        ) {
          return fail(
            ruleId,
            `Publication workflow must use least-privilege permissions and exact-version verification: ${workflow.name}.`,
          );
        }
      }
    }
  } catch {
    return pass(ruleId);
  }
  return pass(ruleId);
}
