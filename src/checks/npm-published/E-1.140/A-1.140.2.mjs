import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../../ghcr-published/read-workflows.mjs";
import { hasExactTagTrigger, hasUbuntuRunner } from "../../ghcr-published/workflow-policy.mjs";
import { npmPublicationJobs } from "../../ghcr-published/workflow-publication.mjs";
import { workflowText } from "../../ghcr-published/workflow-structure.mjs";

export const ruleId = "A-1.140.2";
export const parentRuleId = "E-1.140";

export async function run({ root, packageJson }) {
  let workflows;
  try {
    workflows = await readWorkflows(root);
  } catch {
    return pass(ruleId);
  }
  for (const workflow of workflows) {
    const publication = npmPublicationJobs(workflow);
    if (publication.length === 0) {
      if (/\bnpm\s+publish\b/i.test(workflow.content)) {
        return fail(ruleId, `Publication workflow could not be parsed: ${workflow.name}.`);
      }
      continue;
    }
    const version = packageJson?.version;
    const text = workflowText(workflow);
    const verifiedVersion =
      /npm\s+(?:pkg\s+get\s+version|view)\b/i.test(text) &&
      /github\.ref_name|github\.ref|release_ref/i.test(text) &&
      new RegExp(`v?${String(version).replaceAll(".", "\\.")}`).test(text);
    if (
      !hasExactTagTrigger(workflow) ||
      typeof version !== "string" ||
      !verifiedVersion ||
      !publication.some(({ job }) => hasUbuntuRunner(workflow, job))
    ) {
      return fail(
        ruleId,
        `Publication workflow must use exact version tags, verify package version, and validate on Ubuntu: ${workflow.name}.`,
      );
    }
  }
  return pass(ruleId);
}
