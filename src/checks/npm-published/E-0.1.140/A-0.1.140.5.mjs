import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../../ghcr-published/read-workflows.mjs";
import { findValidationJobs } from "../../ghcr-published/find-validation-jobs.mjs";
import { npmPublicationJobs } from "../npm-publication-jobs.mjs";
import { hasNpmProvenancePublish } from "./has-npm-provenance-publish.mjs";
import { validateNpmOidcPermissionScope } from "./validate-npm-oidc-permission-scope.mjs";
import { validateNpmOidcPublishSetup } from "./validate-npm-oidc-publish-setup.mjs";

export const ruleId = "A-0.1.140.5";
export const parentRuleId = "E-0.1.140";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run(context) {
  try {
    const workflows = await readWorkflows(context.root, context);
    const workflow = workflows.find(({ name }) => name === "publish.yml");
    if (!workflow) return fail(ruleId, "npm Trusted Publishing requires publish.yml.");
    const publicationJobs = npmPublicationJobs(workflow);
    if (publicationJobs.length === 0)
      return fail(ruleId, "publish.yml must contain an npm publication job.");
    const validationJobs = findValidationJobs(workflow);
    const permissionError = validateNpmOidcPermissionScope(
      workflow,
      publicationJobs,
      validationJobs,
    );
    const failures = permissionError ? [permissionError] : [];
    for (const { job } of publicationJobs) {
      const setupError = validateNpmOidcPublishSetup(job);
      if (setupError) failures.push(setupError);
      if (!hasNpmProvenancePublish(job))
        failures.push("The npm publication job must run npm publish --provenance.");
    }
    if (failures.length) return fail(ruleId, failures.join("\n"));
  } catch (error) {
    return fail(ruleId, `npm Trusted Publishing workflows could not be read: ${error.message}`);
  }
  return pass(ruleId);
}
