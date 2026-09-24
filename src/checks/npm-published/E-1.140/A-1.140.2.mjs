import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../../ghcr-published/read-workflows.mjs";
import { hasExactTagTrigger } from "../../ghcr-published/has-exact-tag-trigger.mjs";
import { hasUbuntuRunner } from "../../ghcr-published/has-ubuntu-runner.mjs";
import { npmPublicationJobs } from "../../ghcr-published/workflow-publication.mjs";
import { steps } from "../../ghcr-published/workflow-structure.mjs";

export const ruleId = "A-1.140.2";
export const parentRuleId = "E-1.140";

export async function run({ root, packageJson }) {
  let workflows;
  try {
    workflows = await readWorkflows(root);
  } catch (error) {
    return fail(ruleId, `npm publication workflows could not be read: ${error.message}`);
  }
  if (!workflows.some((workflow) => npmPublicationJobs(workflow).length > 0)) return fail(ruleId, "npm-published repositories must define a publication workflow.");
  for (const workflow of workflows) {
    const publication = npmPublicationJobs(workflow);
    if (publication.length === 0) {
      if (/\bnpm\s+publish\b/i.test(workflow.content)) {
        return fail(ruleId, `Publication workflow could not be parsed: ${workflow.name}.`);
      }
      continue;
    }
    const version = packageJson?.version;
    const publicationJobs = publication.flatMap(({ job }) => [job]);
    const verifiedVersion = typeof version === "string" && publicationJobs.some((job) => {
      const jobSteps = steps(job);
      const verifyIndex = jobSteps.findIndex(({ run }) => typeof run === "string" &&
        /^test\s+["']?\$\(npm\s+pkg\s+get\s+version\s+--raw\)["']?\s*=\s*["']?\$\{GITHUB_REF_NAME#v\}["']?$/iu.test(run.trim()));
      const publishIndex = jobSteps.findIndex(({ run }) => /^npm\s+publish\b/iu.test(String(run).trim()));
      return verifyIndex >= 0 && publishIndex > verifyIndex;
    });
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
