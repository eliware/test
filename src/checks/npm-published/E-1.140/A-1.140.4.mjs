import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../../ghcr-published/read-workflows.mjs";
import { permissions } from "../../ghcr-published/workflow-policy.mjs";
import { npmPublicationJobs } from "../../ghcr-published/workflow-publication.mjs";
import { stepText, steps } from "../../ghcr-published/workflow-structure.mjs";

export const ruleId = "A-1.140.4";
export const parentRuleId = "E-1.140";

function publicationIndex(job, packageName) {
  const escapedName = packageName.replaceAll("/", "\\/");
  return steps(job).findIndex((step) => {
    const command = stepText(step).trim();
    return new RegExp(`^npm\\s+publish(?:\\s+--[A-Za-z0-9_-]+(?:\\s+|$))*$`, "iu").test(command) &&
      !new RegExp(`\\s${escapedName}(?:\\s|$)`, "u").test(command);
  });
}

function exactVerificationIndex(job, packageName) {
  const escapedName = packageName.replaceAll("/", "\\/");
  const pattern = new RegExp(
    `^npm\\s+(?:view|info)\\s+${escapedName}@\\$\\(npm\\s+pkg\\s+get\\s+version\\s+--raw\\)\\s+version\\s+--registry=https://registry\\.npmjs\\.org/?$`,
    "iu",
  );
  return steps(job).findIndex((step) => pattern.test(stepText(step).trim()));
}

export async function run({ root, packageJson }) {
  try {
    const workflows = await readWorkflows(root);
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
        const publishAt = packageName ? publicationIndex(job, packageName) : -1;
        const verifyAt = packageName ? exactVerificationIndex(job, packageName) : -1;
        const verified = verifyAt > publishAt;
        if (
          (publishAt < 0 ||
            (granted.contents !== "read" ||
            granted["id-token"] !== "write" ||
            Object.keys(granted).some((key) => !allowed.has(key)) ||
            !verified ||
            /NPM_TOKEN|NODE_AUTH_TOKEN/i.test(JSON.stringify(job))))
        ) {
          return fail(
            ruleId,
            `Publication workflow must use least-privilege permissions and exact-version verification: ${workflow.name}.`,
          );
        }
      }
    }
  } catch (error) {
    return fail(ruleId, `npm publication workflows could not be read: ${error.message}`);
  }
  return pass(ruleId);
}
